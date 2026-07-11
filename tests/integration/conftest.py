"""
SprintSim integration test fixtures.

Requires a running Next.js server and a Supabase instance.
Configure via environment variables (or a .env.test file):

  BASE_URL              http://localhost:3000
  SUPABASE_URL          https://<project>.supabase.co
  SUPABASE_ANON_KEY     eyJ...
  TEST_STUDENT_EMAIL    student@test.example
  TEST_STUDENT_PASSWORD testpassword123
  TEST_INSTRUCTOR_EMAIL instructor@test.example  (must already be role=instructor in DB)
  TEST_INSTRUCTOR_PASSWORD testpassword123
  TEST_JOIN_CODE        cs3330-f26
"""

import os
import time
import pytest
import httpx
from dotenv import load_dotenv

load_dotenv(".env.test", override=False)
load_dotenv(".env.local", override=False)

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
TEST_STUDENT_EMAIL = os.environ.get("TEST_STUDENT_EMAIL", "integration-student@test.example")
TEST_STUDENT_PASSWORD = os.environ.get("TEST_STUDENT_PASSWORD", "IntegrationTest123!")
TEST_INSTRUCTOR_EMAIL = os.environ.get("TEST_INSTRUCTOR_EMAIL", "naomihbeltrand@gmail.com")
TEST_INSTRUCTOR_PASSWORD = os.environ.get("TEST_INSTRUCTOR_PASSWORD", "")
TEST_JOIN_CODE = os.environ.get("TEST_JOIN_CODE", "cs3330-f26")


def supabase_auth(email: str, password: str) -> dict:
    """Sign in via Supabase Auth REST and return the session dict."""
    resp = httpx.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def supabase_signup(email: str, password: str) -> dict:
    """Sign up a new user via Supabase Auth REST."""
    resp = httpx.post(
        f"{SUPABASE_URL}/auth/v1/signup",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def api(method: str, path: str, token: str = "", **kwargs) -> httpx.Response:
    """Make a request to the Next.js API."""
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return httpx.request(
        method,
        f"{BASE_URL}{path}",
        headers=headers,
        timeout=30,
        **kwargs,
    )


@pytest.fixture(scope="session")
def server_ready():
    """Wait for the Next.js dev server to be reachable."""
    for attempt in range(20):
        try:
            httpx.get(BASE_URL, timeout=3).raise_for_status()
            return True
        except Exception:
            time.sleep(3)
    pytest.skip(f"Next.js server not reachable at {BASE_URL}")


@pytest.fixture(scope="session")
def student_token(server_ready):
    """
    Return an access token for the integration test student.
    Attempts login first; falls back to signup (email confirmation must be disabled).
    """
    try:
        session = supabase_auth(TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD)
        return session["access_token"]
    except httpx.HTTPStatusError:
        session = supabase_signup(TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD)
        # After signup, sign in to get the token
        time.sleep(1)
        session = supabase_auth(TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD)
        return session["access_token"]


@pytest.fixture(scope="session")
def instructor_token(server_ready):
    """Return an access token for the instructor account."""
    if not TEST_INSTRUCTOR_PASSWORD:
        pytest.skip("TEST_INSTRUCTOR_PASSWORD not set — skipping instructor tests")
    session = supabase_auth(TEST_INSTRUCTOR_EMAIL, TEST_INSTRUCTOR_PASSWORD)
    return session["access_token"]


@pytest.fixture(scope="session")
def enrolled_student_token(student_token):
    """
    Ensure the test student is enrolled in the course, then return their token.
    Idempotent — safe to call if already enrolled.
    """
    resp = api("POST", f"/api/join/{TEST_JOIN_CODE}", token=student_token)
    # 200 = enrolled now, 409 = already enrolled — both are fine
    assert resp.status_code in (200, 409), f"Unexpected join status: {resp.status_code} {resp.text}"
    return student_token
