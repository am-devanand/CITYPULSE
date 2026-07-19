"""
Tests for User and Complaint models.
"""

import pytest
from django.contrib.auth import get_user_model

from api.models import Complaint

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestUserModel:
    def test_create_citizen(self):
        user = User.objects.create_user(
            username="alice", password="secret", role="CITIZEN"
        )
        assert user.username == "alice"
        assert user.role == "CITIZEN"
        assert user.check_password("secret")
        assert not user.is_staff

    def test_create_all_roles(self):
        for role, label in User.ROLE_CHOICES:
            user = User.objects.create_user(
                username=f"user_{role}", password="p", role=role
            )
            assert user.role == role

    def test_str_citizen(self):
        user = User.objects.create_user(
            username="bob", password="p", role="CITIZEN"
        )
        assert str(user) == "bob (Citizen)"

    def test_str_collector(self):
        user = User.objects.create_user(
            username="charlie", password="p", role="COLLECTOR"
        )
        assert str(user) == "charlie (Garbage Collector)"

    def test_str_inspector(self):
        user = User.objects.create_user(
            username="dave", password="p", role="INSPECTOR"
        )
        assert str(user) == "dave (Sanitary Inspector)"

    def test_str_officer(self):
        user = User.objects.create_user(
            username="eve", password="p", role="OFFICER"
        )
        assert str(user) == "eve (Municipal Officer)"

    def test_db_table(self):
        assert User._meta.db_table == "users"

    def test_phone_optional(self):
        user = User.objects.create_user(
            username="frank", password="p", role="CITIZEN", phone="+911234567890"
        )
        assert user.phone == "+911234567890"

        user2 = User.objects.create_user(
            username="grace", password="p", role="CITIZEN"
        )
        assert user2.phone is None


class TestComplaintModel:
    def test_create_minimal(self):
        complaint = Complaint.objects.create(
            location_coords="11.0168,76.9558",
            location_address="Test Address",
        )
        assert complaint.complaint_id.startswith("CC-")
        assert complaint.status == "PENDING"
        assert complaint.urgency_level == 1
        assert complaint.complainant is None
        assert complaint.assigned_to is None

    def test_complaint_id_format(self):
        complaint = Complaint.objects.create(
            location_coords="11.0168,76.9558",
            location_address="Test Address",
        )
        parts = complaint.complaint_id.split("-")
        assert len(parts) == 3
        assert parts[0] == "CC"
        assert len(parts[1]) == 8  # YYYYMMDD
        assert len(parts[2]) == 4  # UUID suffix

    def test_str(self):
        complaint = Complaint.objects.create(
            location_coords="11.0168,76.9558",
            location_address="Test Address",
        )
        assert str(complaint) == f"{complaint.complaint_id} - {complaint.status}"

    def test_with_complainant(self, guest_user):
        complaint = Complaint.objects.create(
            complainant=guest_user,
            complainant_name="Guest Person",
            location_coords="11.0168,76.9558",
            location_address="Test Address",
            status="ASSIGNED",
            urgency_level=3,
        )
        assert complaint.complainant == guest_user
        assert complaint.complainant_name == "Guest Person"
        assert complaint.status == "ASSIGNED"
        assert complaint.urgency_level == 3

    def test_default_ordering(self):
        """Complaints ordered by -urgency_level, -created_at."""
        c1 = Complaint.objects.create(
            location_coords="0,0", location_address="A", urgency_level=1
        )
        c2 = Complaint.objects.create(
            location_coords="1,1", location_address="B", urgency_level=3
        )
        c3 = Complaint.objects.create(
            location_coords="2,2", location_address="C", urgency_level=2
        )
        qs = Complaint.objects.all()
        assert list(qs) == [c2, c3, c1]

    def test_db_table(self):
        assert Complaint._meta.db_table == "complaints"
