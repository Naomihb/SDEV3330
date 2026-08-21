"""End-to-end feedback loop: student submits -> instructor sees it, grades it -> student sees grade.

Covers the write->read pairs that broke in production:
  - submissions ordered by submitted_at (created_at column does not exist)
  - feedback written to the feedback table (not submissions columns)
  - instructor submissions list includes the feedback join
  - student can read feedback on own submission via RLS
"""

import httpx
import pytest
from conftest import api, SUPABASE_URL, SUPABASE_ANON_KEY
from test_activity import get_active_week


def rest(path: str, token: str, **params) -> httpx.Response:
    return httpx.get(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
        params=params,
        timeout=15,
    )


@pytest.fixture(scope="module")
def student_submission(enrolled_student_token):
    """Ensure the test student has a submission for the active week; return it."""
    week = get_active_week(enrolled_student_token)
    if week is None:
        pytest.skip("No active submission week (2-13) — activate one to run feedback loop tests")
    resp = api(
        "POST", "/api/submissions", token=enrolled_student_token,
        json={"weekId": week["id"],
              "responseText": "Integration test response: as Scrum Master I would facilitate a discussion."},
    )
    assert resp.status_code == 200, f"Submission failed: {resp.status_code} {resp.text}"
    return resp.json()


class TestFeedbackLoop:

    def test_instructor_sees_student_submission(self, instructor_token, student_submission):
        resp = api("GET", "/api/instructor/submissions", token=instructor_token)
        assert resp.status_code == 200, resp.text
        subs = resp.json()
        assert any(s["id"] == student_submission["id"] for s in subs), \
            "Student submission missing from instructor list"

    def test_instructor_list_includes_feedback_join(self, instructor_token, student_submission):
        resp = api("GET", "/api/instructor/submissions", token=instructor_token)
        assert resp.status_code == 200
        sub = next(s for s in resp.json() if s["id"] == student_submission["id"])
        assert "feedback" in sub, "Instructor submissions must include feedback join for graded/ungraded split"

    def test_instructor_can_save_feedback(self, instructor_token, student_submission):
        resp = api(
            "POST", "/api/feedback", token=instructor_token,
            json={"submissionId": student_submission["id"], "grade": "S",
                  "feedbackText": "Integration test feedback"},
        )
        assert resp.status_code == 200, f"Feedback save failed: {resp.status_code} {resp.text}"
        body = resp.json()
        assert body["grade"] == "S"
        assert body["submission_id"] == student_submission["id"]

    def test_feedback_save_is_idempotent_update(self, instructor_token, student_submission):
        """Saving twice must update the existing row, not create duplicates."""
        for grade in ("S", "E"):
            resp = api(
                "POST", "/api/feedback", token=instructor_token,
                json={"submissionId": student_submission["id"], "grade": grade,
                      "feedbackText": f"Updated to {grade}"},
            )
            assert resp.status_code == 200, resp.text
        rows = rest("feedback", instructor_token,
                    submission_id=f"eq.{student_submission['id']}", select="id,grade").json()
        assert len(rows) == 1, f"Expected 1 feedback row, got {len(rows)}"
        assert rows[0]["grade"] == "E"

    def test_student_can_read_own_feedback(self, enrolled_student_token, instructor_token, student_submission):
        api("POST", "/api/feedback", token=instructor_token,
            json={"submissionId": student_submission["id"], "grade": "S",
                  "feedbackText": "Visible to student"})
        rows = rest(
            "submissions", enrolled_student_token,
            id=f"eq.{student_submission['id']}",
            select="id,feedback(grade,feedback_text)",
        ).json()
        assert rows, "Student cannot read own submission"
        fb = rows[0].get("feedback")
        assert fb, "Student cannot read feedback on own submission (RLS or join broken)"
        # PostgREST may return the embed as an object (to-one) or a list
        fb_row = fb[0] if isinstance(fb, list) else fb
        assert fb_row["grade"] in ("S", "U", "E", "I")

    def test_feedback_grade_is_valid_enum(self, instructor_token, student_submission):
        resp = api(
            "POST", "/api/feedback", token=instructor_token,
            json={"submissionId": student_submission["id"], "grade": "A+", "feedbackText": "x"},
        )
        assert resp.status_code == 400


class TestSubmissionOrdering:

    def test_instructor_submissions_endpoint_does_not_500(self, instructor_token):
        """Regression: ordering by nonexistent created_at column returned 500."""
        resp = api("GET", "/api/instructor/submissions", token=instructor_token)
        assert resp.status_code == 200, f"Endpoint broken: {resp.text}"

    def test_student_can_query_own_submissions_ordered(self, enrolled_student_token):
        resp = rest("submissions", enrolled_student_token,
                    select="id,submitted_at", order="submitted_at.desc")
        assert resp.status_code == 200, f"submitted_at ordering broken: {resp.text}"


class TestActiveWeekVisibility:

    def test_active_week_readable_by_student(self, enrolled_student_token):
        resp = rest("weeks", enrolled_student_token,
                    is_active="eq.true", select="id,week_number", order="week_number.desc")
        assert resp.status_code == 200
        # There may be zero active weeks, but the query itself must work
        assert isinstance(resp.json(), list)

    def test_sprint_tickets_use_assignee_name(self, enrolled_student_token):
        """Regression: join route inserted 'assignee', schema has 'assignee_name'."""
        resp = rest("sprint_tickets", enrolled_student_token,
                    select="id,assignee_name", limit="1")
        assert resp.status_code == 200, f"assignee_name column missing: {resp.text}"
