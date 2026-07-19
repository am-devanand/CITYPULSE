"""
Tests for authentication views:
  - GET  /api/csrf/          -> CSRFTokenView
  - POST /api/login/         -> LoginView  (guest + regular)
  - POST /api/logout/        -> LogoutView
  - GET  /api/users/me/      -> UserViewSet.me
  - GET  /api/users/collectors/ -> UserViewSet.collectors
"""

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestCSRFTokenView:
    def test_get_returns_csrf_cookie(self, api_client):
        resp = api_client.get("/api/csrf/")
        assert resp.status_code == 200
        assert resp.data["message"] == "CSRF cookie set"
        assert "csrftoken" in resp.cookies or "csrf" in resp.cookies


class TestLoginView:
    GUEST_PAYLOAD = {"username": "guest", "password": "guest", "role": "CITIZEN"}

    def test_guest_login_success(self, api_client):
        resp = api_client.post("/api/login/", self.GUEST_PAYLOAD, format="json")
        assert resp.status_code == 200
        assert resp.data["message"] == "Guest login successful"
        assert resp.data["user"]["username"] == "guest"

    def test_guest_login_reuses_single_user(self, api_client):
        """Multiple guest logins must NOT create duplicate guest users."""
        for _ in range(5):
            resp = api_client.post("/api/login/", self.GUEST_PAYLOAD, format="json")
            assert resp.status_code == 200

        assert User.objects.filter(username="guest").count() == 1

    def test_regular_user_login(self, api_client, citizen_user):
        resp = api_client.post(
            "/api/login/",
            {"username": "citizen", "password": "testpass", "role": "CITIZEN"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["message"] == "Login successful"
        assert resp.data["user"]["username"] == "citizen"

    def test_login_wrong_role(self, api_client, collector_user):
        """User is COLLECTOR but tries to login as OFFICER → 403."""
        resp = api_client.post(
            "/api/login/",
            {"username": "collector", "password": "testpass", "role": "OFFICER"},
            format="json",
        )
        assert resp.status_code == 403
        assert "not a" in resp.data["error"].lower()

    def test_login_invalid_credentials(self, api_client):
        resp = api_client.post(
            "/api/login/",
            {"username": "nonexistent", "password": "wrong", "role": "CITIZEN"},
            format="json",
        )
        assert resp.status_code == 401
        assert "invalid" in resp.data["error"].lower()

    def test_guest_login_wrong_role(self, api_client, guest_user):
        """Guest user (CITIZEN) attempted with non-CITIZEN role → 403."""
        resp = api_client.post(
            "/api/login/",
            {"username": "guest", "password": "guest", "role": "OFFICER"},
            format="json",
        )
        assert resp.status_code == 403


class TestLogoutView:
    def test_logout_unauthenticated(self, api_client):
        """Logout requires auth — unauthenticated POST gets 403."""
        resp = api_client.post("/api/logout/", format="json")
        assert resp.status_code == 403

    def test_logout_authenticated(self, api_client, citizen_user):
        api_client.force_login(citizen_user)
        resp = api_client.post("/api/logout/", format="json")
        assert resp.status_code == 200


class TestUserViewSetMe:
    def test_authenticated(self, api_client, inspector_user):
        api_client.force_login(inspector_user)
        resp = api_client.get("/api/users/me/")
        assert resp.status_code == 200
        assert resp.data["username"] == "inspector"
        assert resp.data["role"] == "INSPECTOR"

    def test_unauthenticated(self, api_client):
        resp = api_client.get("/api/users/me/")
        assert resp.status_code == 401
        assert "not authenticated" in resp.data["error"].lower()


class TestUserViewSetCollectors:
    def test_list_collectors(self, api_client, collector_user):
        # Create a second collector
        User.objects.create_user(
            username="collector2", password="p", role="COLLECTOR"
        )
        resp = api_client.get("/api/users/collectors/")
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.data]
        assert "collector" in usernames
        assert "collector2" in usernames

    def test_only_collectors_returned(self, api_client, inspector_user, collector_user):
        resp = api_client.get("/api/users/collectors/")
        assert resp.status_code == 200
        for u in resp.data:
            assert u["role"] == "COLLECTOR"

    def test_empty_collectors(self, api_client):
        resp = api_client.get("/api/users/collectors/")
        assert resp.status_code == 200
        assert resp.data == []
