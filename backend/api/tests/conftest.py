"""
Common fixtures for City Care API tests.
"""

from io import BytesIO

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from api.models import Complaint

User = get_user_model()


def create_test_image():
    """Create a small in-memory JPEG for testing file uploads."""
    img = Image.new("RGB", (1, 1), color="red")
    buf = BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return SimpleUploadedFile("test.jpg", buf.read(), content_type="image/jpeg")


# ---------------------------------------------------------------------------
# Client fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def api_client():
    """DRF API client for view tests."""
    return APIClient()


@pytest.fixture
def authed_client(api_client, inspector_user):
    """API client logged in as inspector."""
    api_client.force_login(inspector_user)
    return api_client


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def guest_user():
    user, _ = User.objects.get_or_create(
        username="guest", defaults={"role": "CITIZEN", "email": "guest@citycare.com"}
    )
    user.set_password("guest")
    user.save()
    return user


@pytest.fixture
def citizen_user():
    user = User.objects.create_user(
        username="citizen",
        password="testpass",
        role="CITIZEN",
        email="citizen@test.com",
    )
    return user


@pytest.fixture
def inspector_user():
    return User.objects.create_user(
        username="inspector",
        password="testpass",
        role="INSPECTOR",
        email="inspector@test.com",
    )


@pytest.fixture
def collector_user():
    return User.objects.create_user(
        username="collector",
        password="testpass",
        role="COLLECTOR",
        email="collector@test.com",
    )


@pytest.fixture
def officer_user():
    return User.objects.create_user(
        username="officer",
        password="testpass",
        role="OFFICER",
        email="officer@test.com",
    )


# ---------------------------------------------------------------------------
# Complaint fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def complaint_pending(guest_user):
    return Complaint.objects.create(
        complainant=guest_user,
        complainant_name="Test User",
        location_coords="11.0168,76.9558",
        location_address="Gandhipuram, Coimbatore",
        status="PENDING",
        urgency_level=1,
    )


@pytest.fixture
def complaint_assigned(guest_user, collector_user):
    return Complaint.objects.create(
        complainant=guest_user,
        complainant_name="Test User",
        location_coords="11.0045,76.9616",
        location_address="RS Puram, Coimbatore",
        status="ASSIGNED",
        urgency_level=2,
        assigned_to=collector_user,
    )
