"""Tests for the /api/join/[code] enrollment endpoint."""

import pytest
from conftest import api, TEST_JOIN_CODE


class TestJoinEndpoint:

    def test_invalid_join_code_returns_404(self, student_token):
        resp = api("POST", "/api/join/not-a-real-code", token=student_token)
        assert resp.status_code == 404

    def test_valid_join_code_returns_200_or_409(self, student_token):
        resp = api("POST", f"/api/join/{TEST_JOIN_CODE}", token=student_token)
        # 200 = freshly enrolled, 409 = already enrolled (both valid)
        assert resp.status_code in (200, 409), resp.text

    def test_successful_join_returns_project_name(self, student_token):
        resp = api("POST", f"/api/join/{TEST_JOIN_CODE}", token=student_token)
        if resp.status_code == 200:
            body = resp.json()
            assert "project" in body
            assert isinstance(body["project"], str)
            assert len(body["project"]) > 0

    def test_already_enrolled_returns_409(self, enrolled_student_token):
        # enrolled_student_token fixture already enrolled — second join must be 409
        resp = api("POST", f"/api/join/{TEST_JOIN_CODE}", token=enrolled_student_token)
        assert resp.status_code == 409
        assert "Already enrolled" in resp.json().get("error", "")

    def test_join_without_token_returns_401(self, server_ready):
        resp = api("POST", f"/api/join/{TEST_JOIN_CODE}")
        assert resp.status_code == 401


class TestPostEnrollmentData:
    """After enrollment, the student should have team and sprint tickets."""

    def test_team_assignment_exists_after_enrollment(self, enrolled_student_token):
        import httpx
        from conftest import SUPABASE_URL, SUPABASE_ANON_KEY
        # Query Supabase directly for the team assignment
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/team_assignments",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {enrolled_student_token}",
            },
            params={"select": "project_name,team_config"},
            timeout=10,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0, "No team assignment found after enrollment"
        assignment = data[0]
        assert "project_name" in assignment
        assert "team_config" in assignment
        assert len(assignment["team_config"]) == 4

    def test_sprint_tickets_seeded_after_enrollment(self, enrolled_student_token):
        import httpx
        from conftest import SUPABASE_URL, SUPABASE_ANON_KEY
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/sprint_tickets",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {enrolled_student_token}",
            },
            params={"select": "sprint_number,ticket_id,title"},
            timeout=10,
        )
        assert resp.status_code == 200
        tickets = resp.json()
        assert len(tickets) == 48, f"Expected 48 tickets, got {len(tickets)}"

    def test_sprint_tickets_cover_all_six_sprints(self, enrolled_student_token):
        import httpx
        from conftest import SUPABASE_URL, SUPABASE_ANON_KEY
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/sprint_tickets",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {enrolled_student_token}",
            },
            params={"select": "sprint_number"},
            timeout=10,
        )
        sprints = {t["sprint_number"] for t in resp.json()}
        assert sprints == {1, 2, 3, 4, 5, 6}

    def test_each_sprint_has_eight_tickets(self, enrolled_student_token):
        import httpx
        from conftest import SUPABASE_URL, SUPABASE_ANON_KEY
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/sprint_tickets",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {enrolled_student_token}",
            },
            params={"select": "sprint_number"},
            timeout=10,
        )
        from collections import Counter
        counts = Counter(t["sprint_number"] for t in resp.json())
        for sprint in range(1, 7):
            assert counts[sprint] == 8, f"Sprint {sprint} has {counts[sprint]} tickets, expected 8"
