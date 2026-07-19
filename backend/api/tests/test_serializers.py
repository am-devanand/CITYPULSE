"""
Tests for all 5 DRF serializers (ResolveComplaintSerializer and RejectComplaintSerializer removed).
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ErrorDetail

from api.models import Complaint
from api.serializers import (
    AssignComplaintSerializer,
    ComplaintCreateSerializer,
    ComplaintSerializer,
    UserCreateSerializer,
    UserSerializer,
)
from api.tests.conftest import create_test_image

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestUserSerializer:
    def test_read_only_fields(self, citizen_user):
        serializer = UserSerializer(citizen_user)
        data = serializer.data
        assert data["id"] == citizen_user.id
        assert data["username"] == "citizen"
        assert data["role"] == "CITIZEN"
        assert data["role_display"] == "Citizen"

    def test_role_display_computed(self, collector_user):
        serializer = UserSerializer(collector_user)
        assert serializer.data["role_display"] == "Garbage Collector"


class TestUserCreateSerializer:
    def test_password_hashing(self):
        serializer = UserCreateSerializer(
            data={
                "username": "newuser",
                "password": "plaintext",
                "role": "CITIZEN",
            }
        )
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        assert user.check_password("plaintext")
        assert user.password != "plaintext"

    def test_min_length_validation(self):
        serializer = UserCreateSerializer(
            data={
                "username": "shortpwd",
                "password": "ab",
                "role": "CITIZEN",
            }
        )
        assert not serializer.is_valid()
        assert "password" in serializer.errors

    def test_write_only_password(self, citizen_user):
        serializer = UserSerializer(citizen_user)
        assert "password" not in serializer.data


class TestComplaintSerializer:
    def test_fields(self, complaint_pending):
        serializer = ComplaintSerializer(complaint_pending)
        data = serializer.data
        assert data["complaint_id"] == complaint_pending.complaint_id
        assert data["status"] == "PENDING"
        assert data["urgency_level"] == 1
        assert data["location_coords"] == "11.0168,76.9558"
        assert data["location_address"] == "Gandhipuram, Coimbatore"
        assert data["complainant_username"] == "guest"

    def test_assigned_fields(self, complaint_assigned, collector_user):
        serializer = ComplaintSerializer(complaint_assigned)
        data = serializer.data
        assert data["assigned_to_username"] == "collector"


class TestComplaintCreateSerializer:
    def test_valid_minimal(self):
        serializer = ComplaintCreateSerializer(
            data={
                "complainant_name": "Test",
                "location_coords": "11.0168,76.9558",
                "location_address": "Test Address",
            }
        )
        assert serializer.is_valid(), serializer.errors

    def test_valid_with_image(self):
        img = create_test_image()
        serializer = ComplaintCreateSerializer(
            data={
                "complainant_name": "Test",
                "location_coords": "11.0168,76.9558",
                "location_address": "Test Address",
                "image_before": img,
            }
        )
        # ImageField requires the file to be passed in the request.FILES,
        # not the serializer data — so this validates successfully
        # because DRF serializer just validates presence of the field.
        assert serializer.is_valid(), serializer.errors

    def test_missing_required_fields(self):
        serializer = ComplaintCreateSerializer(data={})
        assert not serializer.is_valid()
        assert "location_coords" in serializer.errors
        assert "location_address" in serializer.errors


class TestAssignComplaintSerializer:
    def test_valid(self):
        serializer = AssignComplaintSerializer(data={"collector_id": 1})
        assert serializer.is_valid()

    def test_missing_collector_id(self):
        serializer = AssignComplaintSerializer(data={})
        assert not serializer.is_valid()
        assert "collector_id" in serializer.errors

    def test_non_integer(self):
        serializer = AssignComplaintSerializer(data={"collector_id": "abc"})
        assert not serializer.is_valid()

