"""Tests for instructor-only endpoints — weeks management and submission review."""

import pytest
import httpx
from conftest import api, SUPABASE_URL, SUPABASE_ANON_KEY


def get_weeks(instructor_token: str) -> list[dict]:
    resp = api("GET", "/api/instructor/weeks", token=instructor_token)
    resp.raise_for_status()
    return resp.json()


class TestWeeksManagement:

    def test_get_weeks_returns_list(self, instructor_token):
        resp = api("GET", "/api/instructor/weeks", token=instructor_token)
        assert resp.status_code == 200
        weeks = resp.json()
        assert isinstance(weeks, list)

    def test_get_weeks_returns_15_weeks(self, instructor_token):
        weeks = get_weeks(instructor_token)
        assert len(weeks) == 15

    def test_weeks_have_required_fields(self, instructor_token):
        weeks = get_weeks(instructor_token)
        for week in weeks:
            assert "id" in week
            assert "week_number" in week
            assert "topic" in week
            assert "is_active" in week
            assert "has_submission" in week

    def test_weeks_are_ordered_by_week_number(self, instructor_token):
        weeks = get_weeks(instructor_token)
        numbers = [w["week_number"] for w in weeks]
        assert numbers == sorted(numbers)

    def test_weeks_1_14_15_have_no_submission(self, instructor_token):
        weeks = {w["week_number"]: w for w in get_weeks(instructor_token)}
        assert weeks[1]["has_submission"] is False
        assert weeks[14]["has_submission"] is False
        assert weeks[15]["has_submission"] is False

    def test_weeks_2_through_13_have_submission(self, instructor_token):
        weeks = {w["week_number"]: w for w in get_weeks(instructor_token)}
        for n in range(2, 14):
            assert weeks[n]["has_submission"] is True, f"Week {n} should have submission"

    def test_activate_week_returns_200(self, instructor_token):
        weeks = get_weeks(instructor_token)
        target = next(w for w in weeks if w["has_submission"])
        resp = api(
            "POST", "/api/instructor/weeks",
            token=instructor_token,
            json={"weekId": target["id"], "active": True},
        )
        assert resp.status_code == 200
        assert resp.json().get("success") is True

    def test_deactivate_week_returns_200(self, instructor_token):
        weeks = get_weeks(instructor_token)
        target = next((w for w in weeks if w["is_active"]), weeks[0])
        resp = api(
            "POST", "/api/instructor/weeks",
            token=instructor_token,
            json={"weekId": target["id"], "active": False},
        )
        assert resp.status_code == 200

    def test_activate_does_not_deactivate_other_weeks(self, instructor_token):
        """Multiple weeks can be active simultaneously."""
        weeks = get_weeks(instructor_token)
        submission_weeks = [w for w in weeks if w["has_submission"]]

        # Activate first two submission weeks
        for w in submission_weeks[:2]:
            api("POST", "/api/instructor/weeks", token=instructor_token,
                json={"weekId": w["id"], "active": True})

        # Both should be active
        updated = get_weeks(instructor_token)
        active_ids = {w["id"] for w in updated if w["is_active"]}
        assert submission_weeks[0]["id"] in active_ids
        assert submission_weeks[1]["id"] in active_ids

    def test_missing_week_id_returns_400(self, instructor_token):
        resp = api("POST", "/api/instructor/weeks", token=instructor_token, json={})
        assert resp.status_code == 400

    def test_nonexistent_week_id_returns_404(self, instructor_token):
        resp = api(
            "POST", "/api/instructor/weeks",
            token=instructor_token,
            json={"weekId": "00000000-0000-0000-0000-000000000000", "active": True},
        )
        assert resp.status_code == 404


class TestSubmissionReview:

    def test_get_submissions_returns_list(self, instructor_token):
        resp = api("GET", "/api/instructor/submissions", token=instructor_token)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_submissions_include_student_and_week_info(self, instructor_token):
        submissions = api("GET", "/api/instructor/submissions", token=instructor_token).json()
        if not submissions:
            pytest.skip("No submissions in database yet")
        sub = submissions[0]
        assert "response_text" in sub
        assert "profiles" in sub
        assert "weeks" in sub

    def test_feedback_requires_valid_submission_id(self, instructor_token):
        resp = api(
            "POST", "/api/feedback",
            token=instructor_token,
            json={
                "submissionId": "00000000-0000-0000-0000-000000000000",
                "grade": "S",
                "feedbackText": "Good work.",
            },
        )
        # Should fail with 404 or 500 (no submission found), not 200
        assert resp.status_code != 200

    def test_feedback_requires_valid_grade(self, instructor_token):
        """Grade must be one of S, U, E, I."""
        submissions = api("GET", "/api/instructor/submissions", token=instructor_token).json()
        if not submissions:
            pytest.skip("No submissions to grade")
        sub = submissions[0]
        resp = api(
            "POST", "/api/feedback",
            token=instructor_token,
            json={
                "submissionId": sub["id"],
                "grade": "INVALID_GRADE",
                "feedbackText": "test",
            },
        )
        assert resp.status_code != 200
