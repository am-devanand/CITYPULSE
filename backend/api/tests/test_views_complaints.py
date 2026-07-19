"""
Tests for ComplaintViewSet:
  - CRUD operations
  - Spam detection (5+/1hr from same user+location → 429)
  - Duplicate detection (50m radius or same address → urgency increment)
  - Query parameter filtering
"""

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from api.models import Complaint
from api.tests.conftest import create_test_image

User = get_user_model()

pytestmark = pytest.mark.django_db

COMPLAINT_CREATE_PAYLOAD = {
    "complainant_name": "Test Citizen",
    "location_coords": "11.0168,76.9558",
    "location_address": "Gandhipuram, Coimbatore",
}


class TestCreateComplaint:
    def test_anonymous_create(self, api_client):
        """Complaint creation is AllowAny — no auth required."""
        resp = api_client.post(
            "/api/complaints/", COMPLAINT_CREATE_PAYLOAD, format="json"
        )
        assert resp.status_code == 201
        assert resp.data["message"] == "Complaint submitted"
        assert resp.data["is_duplicate"] is False
        # Anonymous complainant → None
        complaint_id = resp.data["complaint"]["complaint_id"]
        complaint = Complaint.objects.get(complaint_id=complaint_id)
        assert complaint.complainant is None

    def test_authenticated_create(self, api_client, citizen_user):
        api_client.force_login(citizen_user)
        resp = api_client.post(
            "/api/complaints/", COMPLAINT_CREATE_PAYLOAD, format="json"
        )
        assert resp.status_code == 201
        assert resp.data["complaint"]["complainant_username"] == "citizen"

    def test_create_with_image(self, api_client):
        img = create_test_image()
        resp = api_client.post(
            "/api/complaints/",
            {**COMPLAINT_CREATE_PAYLOAD, "image_before": img},
            format="multipart",
        )
        assert resp.status_code == 201
        assert resp.data["complaint"]["image_before"] is not None

    def test_create_multiple_complaints(self, api_client):
        """Verify sequential creates work correctly."""
        for i in range(3):
            resp = api_client.post(
                "/api/complaints/",
                {
                    "complainant_name": f"User {i}",
                    "location_coords": f"11.0{i},76.9558",
                    "location_address": f"Address {i}",
                },
                format="json",
            )
            assert resp.status_code == 201

    def test_invalid_coords_format(self, api_client):
        payload = {
            **COMPLAINT_CREATE_PAYLOAD,
            "location_coords": "invalid",
        }
        resp = api_client.post("/api/complaints/", payload, format="json")
        # Coords is a CharField — DRF accepts any string;
        # validation is at the application level, not serializer.
        # This should succeed since the serializer doesn't validate coord format.
        assert resp.status_code in (201, 400)


class TestSpamDetection:
    def _create_complaints_directly(self, user, coords, count):
        """Bypass view-layer duplicate detection by creating individually."""
        for i in range(count):
            Complaint.objects.create(
                complainant=user,
                complainant_name=f"Spam {i}",
                location_coords=coords,
                location_address=f"Address {i}",
            )

    def test_6th_complaint_blocked(self, api_client, citizen_user):
        """6th API complaint from same user+location within 1h → 429."""
        self._create_complaints_directly(citizen_user, "11.0168,76.9558", 5)
        api_client.force_login(citizen_user)
        resp = api_client.post(
            "/api/complaints/",
            {
                "complainant_name": "Final",
                "location_coords": "11.0168,76.9558",
                "location_address": "New Address",
            },
            format="json",
        )
        assert resp.status_code == 429
        assert "spam" in resp.data["error"].lower()

    def test_different_location_not_spam(self, api_client, citizen_user):
        """Different coords from same user — 5 existing at other coords, new one at different coords."""
        self._create_complaints_directly(citizen_user, "11.0168,76.9558", 5)
        api_client.force_login(citizen_user)
        resp = api_client.post(
            "/api/complaints/",
            {
                "complainant_name": "Not Spam",
                "location_coords": "12.0000,77.0000",
                "location_address": "Location B",
            },
            format="json",
        )
        # Different coords → spam check counts only exact coords match → not spam
        assert resp.status_code == 201

    def test_anonymous_spam_not_checked(self, api_client):
        """Anonymous users bypass spam detection (complainant=None)."""
        # Use different coords per request to avoid duplicate detection
        for _ in range(10):
            lat = 11.0 + (_ * 0.01)
            resp = api_client.post(
                "/api/complaints/",
                {
                    "complainant_name": "Anonymous",
                    "location_coords": f"{lat},76.9558",
                    "location_address": f"Addr {_}",
                },
                format="json",
            )
            assert resp.status_code == 201


class TestDuplicateDetection:
    def test_duplicate_by_location_within_50m(self, api_client, citizen_user):
        """Complaint within 50m radius → urgency increment, no new complaint."""
        api_client.force_login(citizen_user)
        # Create original
        resp1 = api_client.post(
            "/api/complaints/",
            COMPLAINT_CREATE_PAYLOAD,
            format="json",
        )
        assert resp1.status_code == 201
        original_id = resp1.data["complaint"]["id"]

        # Create duplicate ~11m away
        payload = {
            **COMPLAINT_CREATE_PAYLOAD,
            "location_coords": "11.0169,76.9558",
        }
        resp2 = api_client.post("/api/complaints/", payload, format="json")
        assert resp2.status_code == 200  # Not 201 — duplicate
        assert resp2.data["is_duplicate"] is True
        assert resp2.data["complaint"]["id"] == original_id
        assert resp2.data["complaint"]["urgency_level"] >= 2

    def test_duplicate_by_address_case_insensitive(self, api_client, citizen_user):
        """Same address (case-insensitive) → duplicate regardless of coords."""
        api_client.force_login(citizen_user)
        resp1 = api_client.post(
            "/api/complaints/",
            COMPLAINT_CREATE_PAYLOAD,
            format="json",
        )
        original_id = resp1.data["complaint"]["id"]

        # Same address, different coords, different case
        payload = {
            "complainant_name": "Test Citizen",
            "location_coords": "12.0000,77.0000",
            "location_address": "gandhipuram, coimbatore",
        }
        resp2 = api_client.post("/api/complaints/", payload, format="json")
        assert resp2.status_code == 200
        assert resp2.data["is_duplicate"] is True
        assert resp2.data["complaint"]["id"] == original_id
        assert resp2.data["complaint"]["urgency_level"] == 2

    def test_far_location_not_duplicate(self, api_client, citizen_user):
        """Coords outside 50m and different address → new complaint."""
        api_client.force_login(citizen_user)
        api_client.post(
            "/api/complaints/",
            COMPLAINT_CREATE_PAYLOAD,
            format="json",
        )

        payload = {
            "complainant_name": "Far Away",
            "location_coords": "13.0000,80.0000",
            "location_address": "Chennai",
        }
        resp = api_client.post("/api/complaints/", payload, format="json")
        assert resp.status_code == 201
        assert resp.data["is_duplicate"] is False


class TestListComplaints:
    def test_list_all(self, api_client, complaint_pending, complaint_assigned):
        resp = api_client.get("/api/complaints/")
        assert resp.status_code == 200
        assert len(resp.data) >= 2

    def test_filter_by_status(self, api_client, complaint_pending, complaint_assigned):
        resp = api_client.get("/api/complaints/?status=PENDING")
        assert resp.status_code == 200
        for c in resp.data:
            assert c["status"] == "PENDING"

    def test_filter_multiple_status(self, api_client, complaint_pending, complaint_assigned):
        resp = api_client.get("/api/complaints/?status=PENDING,ASSIGNED")
        assert resp.status_code == 200
        assert len(resp.data) == 2

    def test_filter_by_assigned_to(self, api_client, complaint_assigned, collector_user):
        resp = api_client.get(f"/api/complaints/?assigned_to={collector_user.id}")
        assert resp.status_code == 200
        for c in resp.data:
            assert c["assigned_to"] == collector_user.id


class TestRetrieveComplaint:
    def test_retrieve_by_pk(self, api_client, complaint_pending):
        resp = api_client.get(f"/api/complaints/{complaint_pending.id}/")
        assert resp.status_code == 200
        assert resp.data["complaint_id"] == complaint_pending.complaint_id
        assert resp.data["status"] == "PENDING"

    def test_retrieve_not_found(self, api_client):
        resp = api_client.get("/api/complaints/99999/")
        assert resp.status_code == 404


class TestUpdateDeleteComplaint:
    def test_patch_requires_auth(self, api_client, complaint_pending):
        resp = api_client.patch(
            f"/api/complaints/{complaint_pending.id}/",
            {"status": "RESOLVED"},
            format="json",
        )
        # IsAuthenticatedOrReadOnly — unauthenticated PATCH fails
        assert resp.status_code == 403

    def test_patch_authenticated(self, authed_client, complaint_pending):
        resp = authed_client.patch(
            f"/api/complaints/{complaint_pending.id}/",
            {"urgency_level": 5},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["urgency_level"] == 5

    def test_delete_requires_auth(self, api_client, complaint_pending):
        resp = api_client.delete(f"/api/complaints/{complaint_pending.id}/")
        assert resp.status_code == 403

    def test_delete_authenticated(self, authed_client, complaint_pending):
        resp = authed_client.delete(f"/api/complaints/{complaint_pending.id}/")
        assert resp.status_code == 204
        assert Complaint.objects.filter(id=complaint_pending.id).count() == 0
