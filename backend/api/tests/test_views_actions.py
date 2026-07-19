"""
Tests for action views:
  - POST /api/complaints/<pk>/assign/   -> AssignComplaintView
  - POST /api/complaints/<pk>/resolve/  -> ResolveComplaintView
  - POST /api/complaints/<pk>/reject/   -> RejectComplaintView
  - POST /api/simulate-timeout/         -> SimulateTimeoutView
  - GET  /api/stats/                    -> dashboard_stats
"""

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from api.models import Complaint
from api.tests.conftest import create_test_image

User = get_user_model()

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# Assign
# ---------------------------------------------------------------------------


class TestAssignComplaint:
    def test_assign_success(self, api_client, inspector_user, collector_user, complaint_pending):
        api_client.force_login(inspector_user)
        resp = api_client.post(
            f"/api/complaints/{complaint_pending.id}/assign/",
            {"collector_id": collector_user.id},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["message"] == "Assigned"
        assert resp.data["complaint"]["status"] == "ASSIGNED"
        assert resp.data["complaint"]["assigned_to"] == collector_user.id

    def test_assign_complaint_not_found(self, api_client, inspector_user):
        api_client.force_login(inspector_user)
        resp = api_client.post(
            "/api/complaints/99999/assign/",
            {"collector_id": 1},
            format="json",
        )
        assert resp.status_code == 404
        assert "not found" in resp.data["error"].lower()

    def test_assign_collector_not_found(self, api_client, inspector_user, complaint_pending):
        api_client.force_login(inspector_user)
        resp = api_client.post(
            f"/api/complaints/{complaint_pending.id}/assign/",
            {"collector_id": 99999},
            format="json",
        )
        assert resp.status_code == 404
        assert "collector not found" in resp.data["error"].lower()

    def test_assign_missing_collector_id(self, api_client, inspector_user, complaint_pending):
        api_client.force_login(inspector_user)
        resp = api_client.post(
            f"/api/complaints/{complaint_pending.id}/assign/",
            {},
            format="json",
        )
        assert resp.status_code == 400

    def test_assign_requires_auth(self, api_client, complaint_pending):
        """Assign view should require authentication."""
        resp = api_client.post(
            f"/api/complaints/{complaint_pending.id}/assign/",
            {"collector_id": 1},
            format="json",
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Resolve
# ---------------------------------------------------------------------------


class TestResolveComplaint:
    def test_resolve_without_image(self, api_client, inspector_user, complaint_assigned):
        api_client.force_login(inspector_user)
        resp = api_client.post(
            f"/api/complaints/{complaint_assigned.id}/resolve/",
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["message"] == "Resolved"
        complaint = Complaint.objects.get(id=complaint_assigned.id)
        assert complaint.status == "RESOLVED"

    def test_resolve_with_image(self, api_client, inspector_user, complaint_assigned):
        api_client.force_login(inspector_user)
        img = create_test_image()
        resp = api_client.post(
            f"/api/complaints/{complaint_assigned.id}/resolve/",
            {"image_after": img},
            format="multipart",
        )
        assert resp.status_code == 200
        complaint = Complaint.objects.get(id=complaint_assigned.id)
        assert complaint.status == "RESOLVED"
        assert complaint.image_after.name is not None

    def test_resolve_not_found(self, api_client, inspector_user):
        api_client.force_login(inspector_user)
        resp = api_client.post(
            "/api/complaints/99999/resolve/",
            format="json",
        )
        assert resp.status_code == 404
        assert "not found" in resp.data["error"].lower()

    def test_resolve_requires_auth(self, api_client, complaint_assigned):
        resp = api_client.post(
            f"/api/complaints/{complaint_assigned.id}/resolve/",
            format="json",
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Reject
# ---------------------------------------------------------------------------


class TestRejectComplaint:
    def test_reject_with_reason(self, api_client, inspector_user, complaint_pending):
        api_client.force_login(inspector_user)
        resp = api_client.post(
            f"/api/complaints/{complaint_pending.id}/reject/",
            {"reason": "Not in jurisdiction"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["message"] == "Rejected"
        complaint = Complaint.objects.get(id=complaint_pending.id)
        assert complaint.status == "REJECTED"
        assert complaint.rejected_reason == "Not in jurisdiction"

    def test_reject_without_reason(self, api_client, inspector_user, complaint_pending):
        api_client.force_login(inspector_user)
        resp = api_client.post(
            f"/api/complaints/{complaint_pending.id}/reject/",
            {},
            format="json",
        )
        # The @action reads `request.data.get('reason')` directly — None is accepted.
        assert resp.status_code == 200
        complaint = Complaint.objects.get(id=complaint_pending.id)
        assert complaint.status == "REJECTED"
        assert complaint.rejected_reason is None

    def test_reject_not_found(self, api_client, inspector_user):
        api_client.force_login(inspector_user)
        resp = api_client.post(
            "/api/complaints/99999/reject/",
            {"reason": "Test"},
            format="json",
        )
        assert resp.status_code == 404

    def test_reject_requires_auth(self, api_client, complaint_pending):
        resp = api_client.post(
            f"/api/complaints/{complaint_pending.id}/reject/",
            {"reason": "Test"},
            format="json",
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Simulate Timeout
# ---------------------------------------------------------------------------


class TestSimulateTimeout:
    def test_timeout_with_ids(self, authed_client, complaint_pending, complaint_assigned):
        resp = authed_client.post(
            "/api/simulate-timeout/",
            {"complaint_ids": [complaint_pending.id, complaint_assigned.id]},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["message"] == "2 escalated"
        assert Complaint.objects.get(id=complaint_pending.id).status == "ESCALATED"
        assert Complaint.objects.get(id=complaint_assigned.id).status == "ESCALATED"

    def test_timeout_empty_ids(self, authed_client, complaint_pending):
        """Passing empty complaint_ids list escalates nothing via the IDs path."""
        resp = authed_client.post(
            "/api/simulate-timeout/",
            {"complaint_ids": []},
            format="json",
        )
        assert resp.status_code == 200

    def test_timeout_old_complaints(self, authed_client):
        """Complaints older than 16h are auto-escalated."""
        old = Complaint.objects.create(
            location_coords="11.0168,76.9558",
            location_address="Old Location",
            status="PENDING",
            urgency_level=1,
        )
        # Manually set created_at to 20h ago
        Complaint.objects.filter(id=old.id).update(
            created_at=timezone.now() - timedelta(hours=20)
        )
        resp = authed_client.post(
            "/api/simulate-timeout/",
            {},
            format="json",
        )
        assert resp.status_code == 200
        assert Complaint.objects.get(id=old.id).status == "ESCALATED"

    def test_timeout_force_escalate(self, authed_client):
        """Complaints with force_escalate=True get escalated."""
        c = Complaint.objects.create(
            location_coords="11.0168,76.9558",
            location_address="Force Escalate",
            status="PENDING",
            force_escalate=True,
        )
        resp = authed_client.post(
            "/api/simulate-timeout/",
            {},
            format="json",
        )
        assert resp.status_code == 200
        assert Complaint.objects.get(id=c.id).status == "ESCALATED"

    def test_timeout_recent_not_escalated(self, authed_client):
        """Recent PENDING complaints should NOT be escalated by age logic."""
        recent = Complaint.objects.create(
            location_coords="11.0168,76.9558",
            location_address="Recent",
            status="PENDING",
        )
        resp = authed_client.post(
            "/api/simulate-timeout/",
            {},
            format="json",
        )
        assert Complaint.objects.get(id=recent.id).status == "PENDING"

    def test_timeout_already_resolved_unchanged(self, authed_client):
        """Resolved complaints escalated by ID path."""
        resolved = Complaint.objects.create(
            location_coords="11.0168,76.9558",
            location_address="Resolved",
            status="RESOLVED",
        )
        resp = authed_client.post(
            "/api/simulate-timeout/",
            {"complaint_ids": [resolved.id]},
            format="json",
        )
        assert Complaint.objects.get(id=resolved.id).status == "ESCALATED"


# ---------------------------------------------------------------------------
# Dashboard Stats
# ---------------------------------------------------------------------------


class TestDashboardStats:
    def test_empty_stats(self, api_client):
        resp = api_client.get("/api/stats/")
        assert resp.status_code == 200
        assert resp.data == {
            "total": 0,
            "pending": 0,
            "assigned": 0,
            "resolved": 0,
            "rejected": 0,
            "escalated": 0,
            "active": 0,
        }

    def test_stats_with_data(self, api_client, guest_user):
        Complaint.objects.create(
            complainant=guest_user,
            location_coords="0,0",
            location_address="A",
            status="PENDING",
        )
        Complaint.objects.create(
            complainant=guest_user,
            location_coords="1,1",
            location_address="B",
            status="ASSIGNED",
        )
        Complaint.objects.create(
            complainant=guest_user,
            location_coords="2,2",
            location_address="C",
            status="RESOLVED",
        )
        Complaint.objects.create(
            complainant=guest_user,
            location_coords="3,3",
            location_address="D",
            status="REJECTED",
        )
        Complaint.objects.create(
            complainant=guest_user,
            location_coords="4,4",
            location_address="E",
            status="ESCALATED",
        )
        resp = api_client.get("/api/stats/")
        assert resp.status_code == 200
        assert resp.data == {
            "total": 5,
            "pending": 1,
            "assigned": 1,
            "resolved": 1,
            "rejected": 1,
            "escalated": 1,
            "active": 2,  # pending + assigned
        }
