"""Regression tests for every bug class found in production, plus extrapolated
contract tests designed to catch the same classes of failure elsewhere.

Bug classes covered:
  1. Schema drift — code selecting/ordering by columns that don't exist
     (created_at vs submitted_at, join_code, assignee vs assignee_name)
  2. Embed shape assumptions — PostgREST returns to-one embeds as objects,
     to-many as arrays; UI must not assume one shape
  3. .single() breaking when multiple rows match (multiple active weeks)
  4. Silent write failures — inserts/updates whose errors were never checked
  5. Upsert duplication — resubmitting must update, not duplicate
  6. Write -> read gaps — every write must be visible on the read path
"""

import httpx
import pytest
from conftest import api, SUPABASE_URL, SUPABASE_ANON_KEY


def rest(path: str, token: str, **params) -> httpx.Response:
    return httpx.get(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
        params=params,
        timeout=15,
    )


# ── 1. Schema contract: every column the app selects must exist ──────────────
# Extrapolated from the created_at/join_code/assignee bugs: assert the exact
# column sets used anywhere in the codebase. A missing column returns 400 here
# long before a user sees a broken page.

SCHEMA_CONTRACT = {
    "profiles":         "id,email,full_name,role,created_at",
    "courses":          "id,code,name,semester,instructor_id,join_code,created_at",
    "weeks":            "id,course_id,week_number,topic,description,due_date,is_active,prior_topics,created_at",
    "enrollments":      "id,student_id,course_id,enrolled_at",
    "team_assignments": "id,student_id,course_id,project_name,project_description,team_config,created_at",
    "sprint_tickets":   "id,student_id,course_id,sprint_number,ticket_id,title,status,assignee_name,story_points,is_blocked,created_at",
    "scenarios":        "id,student_id,week_id,content,generated_at",
    "submissions":      "id,student_id,week_id,scenario_id,response_text,submitted_at,updated_at",
    "feedback":         "id,submission_id,instructor_id,grade,feedback_text,submitted_at",
}


class TestSchemaContract:

    @pytest.mark.parametrize("table,columns", SCHEMA_CONTRACT.items())
    def test_all_columns_used_by_code_exist(self, enrolled_student_token, table, columns):
        resp = rest(table, enrolled_student_token, select=columns, limit="1")
        assert resp.status_code == 200, \
            f"Schema drift on '{table}': {resp.json().get('message', resp.text)}"

    @pytest.mark.parametrize("table,order_col", [
        ("submissions", "submitted_at"),
        ("feedback", "submitted_at"),
        ("weeks", "week_number"),
        ("sprint_tickets", "ticket_id"),
    ])
    def test_order_columns_exist(self, enrolled_student_token, table, order_col):
        resp = rest(table, enrolled_student_token, select="id", order=f"{order_col}.desc", limit="1")
        assert resp.status_code == 200, f"Ordering '{table}' by '{order_col}' broken: {resp.text}"

    def test_join_code_resolves_course(self, enrolled_student_token):
        """Regression: /join/[code] queried a join_code column that didn't exist."""
        resp = rest("courses", enrolled_student_token, join_code="eq.cs3330-f26", select="id,name")
        assert resp.status_code == 200, resp.text
        assert len(resp.json()) == 1, "join_code 'cs3330-f26' must resolve exactly one course"


# ── 2. Embed shapes: never assume object vs array ────────────────────────────

class TestEmbedShapes:

    def test_submission_embeds_are_normalizable(self, enrolled_student_token):
        """Regression: feedback embed came back as an object; UI indexed [0] and broke."""
        resp = rest(
            "submissions", enrolled_student_token,
            select="id,weeks(week_number,topic),scenarios(content),feedback(grade,feedback_text)",
        )
        assert resp.status_code == 200, resp.text
        for sub in resp.json():
            for key in ("weeks", "scenarios", "feedback"):
                val = sub.get(key)
                assert val is None or isinstance(val, (dict, list)), \
                    f"Unexpected embed shape for {key}: {type(val)}"
                # The app normalizes both shapes; grade must be reachable either way
                if key == "feedback" and val:
                    row = val[0] if isinstance(val, list) else val
                    assert "grade" in row

    def test_instructor_submissions_feedback_reachable(self, instructor_token):
        resp = api("GET", "/api/instructor/submissions", token=instructor_token)
        assert resp.status_code == 200, resp.text
        for sub in resp.json():
            assert "feedback" in sub
            fb = sub["feedback"]
            assert fb is None or isinstance(fb, (dict, list))


# ── 3. Multiple active weeks must not break anything ─────────────────────────

class TestMultipleActiveWeeks:

    @pytest.fixture()
    def two_active_weeks(self, instructor_token):
        """Activate weeks 2 and 3 simultaneously; restore afterwards."""
        weeks = api("GET", "/api/instructor/weeks", token=instructor_token).json()
        by_num = {w["week_number"]: w for w in weeks}
        originals = {n: by_num[n]["is_active"] for n in (2, 3) if n in by_num}
        for n in (2, 3):
            if n in by_num:
                api("POST", "/api/instructor/weeks", token=instructor_token,
                    json={"weekId": by_num[n]["id"], "active": True})
        yield by_num
        for n, was_active in originals.items():
            api("POST", "/api/instructor/weeks", token=instructor_token,
                json={"weekId": by_num[n]["id"], "active": was_active})

    def test_active_weeks_query_returns_all(self, enrolled_student_token, two_active_weeks):
        """Regression: learn page used .single() and broke with >1 active week."""
        resp = rest("weeks", enrolled_student_token,
                    is_active="eq.true", select="week_number", order="week_number.desc")
        assert resp.status_code == 200
        nums = [w["week_number"] for w in resp.json()]
        assert 2 in nums and 3 in nums, "Both activated weeks must be visible"

    def test_instructor_weeks_endpoint_survives(self, instructor_token, two_active_weeks):
        resp = api("GET", "/api/instructor/weeks", token=instructor_token)
        assert resp.status_code == 200


# ── 4 & 5. Writes must fail loudly and never duplicate ───────────────────────

class TestWriteIntegrity:

    def test_resubmission_updates_not_duplicates(self, enrolled_student_token, instructor_token):
        """Regression class: upsert must respect unique(student_id, week_id)."""
        weeks = api("GET", "/api/instructor/weeks", token=instructor_token).json()
        target = next((w for w in weeks if w["is_active"] and 2 <= w["week_number"] <= 13), None)
        if target is None:
            pytest.skip("No active submission week")
        for text in ("first integration submission text for dedupe test",
                     "second integration submission text for dedupe test"):
            resp = api("POST", "/api/submissions", token=enrolled_student_token,
                       json={"weekId": target["id"], "responseText": text})
            assert resp.status_code == 200, resp.text
        rows = rest("submissions", enrolled_student_token,
                    week_id=f"eq.{target['id']}", select="id,response_text").json()
        assert len(rows) == 1, f"Resubmission created duplicates: {len(rows)} rows"
        assert "second" in rows[0]["response_text"]

    def test_double_enrollment_rejected_loudly(self, enrolled_student_token):
        """Regression class: silent failures. Re-joining must 409, not half-succeed."""
        resp = api("POST", "/api/join/cs3330-f26", token=enrolled_student_token)
        assert resp.status_code == 409
        assert resp.json().get("error")

    def test_invalid_grade_rejected_by_db_contract(self, instructor_token, enrolled_student_token):
        """Grades are S/U/E/I everywhere — API and DB must agree."""
        subs = api("GET", "/api/instructor/submissions", token=instructor_token).json()
        if not subs:
            pytest.skip("No submissions to grade")
        resp = api("POST", "/api/feedback", token=instructor_token,
                   json={"submissionId": subs[0]["id"], "grade": "Z", "feedbackText": "x"})
        assert resp.status_code == 400


# ── 6. Write -> read: every mutation must be visible on its read path ────────

class TestWriteReadLoops:

    def test_week_activation_immediately_visible(self, instructor_token, enrolled_student_token):
        """Regression: activity page served stale active-week data."""
        weeks = api("GET", "/api/instructor/weeks", token=instructor_token).json()
        by_num = {w["week_number"]: w for w in weeks}
        if 4 not in by_num:
            pytest.skip("Week 4 not present")
        original = by_num[4]["is_active"]
        try:
            api("POST", "/api/instructor/weeks", token=instructor_token,
                json={"weekId": by_num[4]["id"], "active": True})
            rows = rest("weeks", enrolled_student_token,
                        id=f"eq.{by_num[4]['id']}", select="is_active").json()
            assert rows and rows[0]["is_active"] is True, "Activation not visible to student read"
        finally:
            api("POST", "/api/instructor/weeks", token=instructor_token,
                json={"weekId": by_num[4]["id"], "active": original})

    def test_ticket_status_update_persists(self, enrolled_student_token):
        """Sprint board writes must round-trip (RLS 'manage own tickets')."""
        rows = rest("sprint_tickets", enrolled_student_token,
                    select="id,status", limit="1").json()
        if not rows:
            pytest.skip("Student has no tickets")
        ticket = rows[0]
        new_status = "in_progress" if ticket["status"] != "in_progress" else "todo"
        upd = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/sprint_tickets",
            headers={"apikey": SUPABASE_ANON_KEY,
                     "Authorization": f"Bearer {enrolled_student_token}",
                     "Content-Type": "application/json",
                     "Prefer": "return=representation"},
            params={"id": f"eq.{ticket['id']}"},
            json={"status": new_status},
            timeout=15,
        )
        assert upd.status_code == 200, f"Ticket update failed: {upd.text}"
        assert upd.json()[0]["status"] == new_status
        # restore
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/sprint_tickets",
            headers={"apikey": SUPABASE_ANON_KEY,
                     "Authorization": f"Bearer {enrolled_student_token}",
                     "Content-Type": "application/json"},
            params={"id": f"eq.{ticket['id']}"},
            json={"status": ticket["status"]},
            timeout=15,
        )
