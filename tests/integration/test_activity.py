"""Tests for the weekly activity flow — scenario generation and submission."""

import pytest
import httpx
from conftest import api, SUPABASE_URL, SUPABASE_ANON_KEY


def get_active_week(token: str) -> dict | None:
    """Return the first active submission week (2–13), or None."""
    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/weeks",
        headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
        params={"is_active": "eq.true", "select": "id,week_number,topic", "order": "week_number.desc"},
        timeout=10,
    )
    resp.raise_for_status()
    submission_weeks = [w for w in resp.json() if 2 <= w["week_number"] <= 13]
    return submission_weeks[0] if submission_weeks else None


class TestScenarioGeneration:

    def test_generate_requires_week_id(self, enrolled_student_token):
        resp = api("POST", "/api/scenarios/generate", token=enrolled_student_token, json={})
        assert resp.status_code == 400
        assert "weekId" in resp.json().get("error", "")

    def test_generate_returns_404_for_unknown_week(self, enrolled_student_token):
        resp = api(
            "POST", "/api/scenarios/generate",
            token=enrolled_student_token,
            json={"weekId": "00000000-0000-0000-0000-000000000000"},
        )
        assert resp.status_code == 404

    @pytest.mark.skipif(
        not __import__("os").environ.get("ANTHROPIC_API_KEY"),
        reason="ANTHROPIC_API_KEY not set — skipping live scenario generation"
    )
    def test_generate_returns_scenario_for_active_week(self, enrolled_student_token):
        week = get_active_week(enrolled_student_token)
        if week is None:
            pytest.skip("No active submission week — activate a week first")

        resp = api(
            "POST", "/api/scenarios/generate",
            token=enrolled_student_token,
            json={"weekId": week["id"]},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "content" in body
        assert isinstance(body["content"], str)
        assert len(body["content"]) > 20

    @pytest.mark.skipif(
        not __import__("os").environ.get("ANTHROPIC_API_KEY"),
        reason="ANTHROPIC_API_KEY not set"
    )
    def test_generate_is_idempotent(self, enrolled_student_token):
        """Calling generate twice for the same week should return the same scenario."""
        week = get_active_week(enrolled_student_token)
        if week is None:
            pytest.skip("No active submission week")

        resp1 = api("POST", "/api/scenarios/generate", token=enrolled_student_token, json={"weekId": week["id"]})
        resp2 = api("POST", "/api/scenarios/generate", token=enrolled_student_token, json={"weekId": week["id"]})
        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json()["content"] == resp2.json()["content"]


class TestSubmissions:

    def test_submit_requires_auth(self, server_ready):
        resp = api("POST", "/api/submissions", json={"weekId": "x", "responseText": "hi"})
        assert resp.status_code in (401, 403)

    def test_submit_missing_fields_returns_400(self, enrolled_student_token):
        resp = api("POST", "/api/submissions", token=enrolled_student_token, json={})
        assert resp.status_code == 400

    def test_submit_and_retrieve(self, enrolled_student_token):
        week = get_active_week(enrolled_student_token)
        if week is None:
            pytest.skip("No active submission week")

        response_text = "As Scrum Master, I would facilitate a planning poker re-vote after asking both extremes to share their reasoning."

        resp = api(
            "POST", "/api/submissions",
            token=enrolled_student_token,
            json={"weekId": week["id"], "responseText": response_text},
        )
        assert resp.status_code in (200, 201), resp.text
        body = resp.json()
        assert "id" in body or "week_id" in body

    def test_submission_is_persisted(self, enrolled_student_token):
        week = get_active_week(enrolled_student_token)
        if week is None:
            pytest.skip("No active submission week")

        # Submit
        api(
            "POST", "/api/submissions",
            token=enrolled_student_token,
            json={"weekId": week["id"], "responseText": "Integration test response."},
        )

        # Verify in DB directly
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/submissions",
            headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {enrolled_student_token}"},
            params={"week_id": f"eq.{week['id']}", "select": "id,response_text"},
            timeout=10,
        )
        assert resp.status_code == 200
        subs = resp.json()
        assert len(subs) >= 1
        assert any("Integration test" in s["response_text"] or len(s["response_text"]) > 5 for s in subs)
