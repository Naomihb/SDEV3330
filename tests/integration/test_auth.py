"""Tests for authentication — token validity, unauthorized access."""

import httpx
import pytest
from conftest import api, BASE_URL


class TestUnauthorizedAccess:
    """All protected endpoints must reject requests with no token."""

    PROTECTED_ENDPOINTS = [
        ("GET",  "/api/instructor/submissions"),
        ("GET",  "/api/instructor/weeks"),
        ("POST", "/api/instructor/weeks"),
        ("POST", "/api/scenarios/generate"),
        ("POST", "/api/submissions"),
        ("POST", "/api/feedback"),
    ]

    @pytest.mark.parametrize("method,path", PROTECTED_ENDPOINTS)
    def test_no_token_returns_401_or_403(self, server_ready, method, path):
        resp = api(method, path)
        assert resp.status_code in (401, 403), (
            f"{method} {path} returned {resp.status_code}, expected 401 or 403"
        )

    def test_invalid_token_returns_401_or_403(self, server_ready):
        resp = api("GET", "/api/instructor/submissions", token="this-is-not-a-real-jwt")
        assert resp.status_code in (401, 403)


class TestStudentCannotAccessInstructorRoutes:
    """Students must be denied instructor-only endpoints."""

    def test_student_cannot_list_submissions(self, enrolled_student_token):
        resp = api("GET", "/api/instructor/submissions", token=enrolled_student_token)
        assert resp.status_code == 403

    def test_student_cannot_list_instructor_weeks(self, enrolled_student_token):
        resp = api("GET", "/api/instructor/weeks", token=enrolled_student_token)
        assert resp.status_code == 403

    def test_student_cannot_activate_week(self, enrolled_student_token):
        resp = api(
            "POST", "/api/instructor/weeks",
            token=enrolled_student_token,
            json={"weekId": "00000000-0000-0000-0000-000000000000", "active": True},
        )
        assert resp.status_code == 403


class TestInstructorClaim:

    def test_claim_requires_auth(self, server_ready):
        import httpx
        from conftest import BASE_URL
        resp = httpx.post(f"{BASE_URL}/api/instructor/claim", json={"code": "x"}, timeout=15)
        assert resp.status_code == 401

    def test_wrong_code_rejected(self, student_token):
        resp = api("POST", "/api/instructor/claim", token=student_token,
                   json={"code": "definitely-not-the-code"})
        # 403 = wrong code; 500 = INSTRUCTOR_JOIN_CODE not configured in this env
        assert resp.status_code in (403, 500)
        assert resp.json().get("error")

    def test_missing_code_rejected(self, student_token):
        resp = api("POST", "/api/instructor/claim", token=student_token, json={})
        assert resp.status_code in (403, 500)
