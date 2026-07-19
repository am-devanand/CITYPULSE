"""
Tests for utility functions (haversine, parse_coords, is_within_radius).
"""

import pytest

from api.utils import haversine_distance, is_within_radius, parse_coords


class TestParseCoords:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("11.0168,76.9558", (11.0168, 76.9558)),
            ("  11.0168  ,  76.9558  ", (11.0168, 76.9558)),
            ("-33.86,151.21", (-33.86, 151.21)),
            ("0.0,0.0", (0.0, 0.0)),
        ],
    )
    def test_valid(self, raw, expected):
        result = parse_coords(raw)
        assert result == pytest.approx(expected, abs=1e-10)

    @pytest.mark.parametrize(
        "raw",
        [
            "",
            "invalid",
            "1,2,3",
            "abc,def",
            ",",
            None,
        ],
    )
    def test_invalid(self, raw):
        assert parse_coords(raw) is None


class TestHaversineDistance:
    def test_same_point(self):
        assert haversine_distance(11.0168, 76.9558, 11.0168, 76.9558) == 0.0

    def test_symmetric(self):
        d1 = haversine_distance(11.0168, 76.9558, 11.02, 76.96)
        d2 = haversine_distance(11.02, 76.96, 11.0168, 76.9558)
        assert d1 == pytest.approx(d2, abs=1e-6)

    def test_positive_distance(self):
        d = haversine_distance(11.0168, 76.9558, 11.02, 76.96)
        assert d > 0

    def test_known_approximation(self):
        # ~111m per 0.001 deg lat → ~500m for 0.0045 deg
        d = haversine_distance(11.0168, 76.9558, 11.0213, 76.9558)
        assert 400 < d < 600

    def test_equator_distance(self):
        # 1 degree longitude at equator ≈ 111_111 m
        d = haversine_distance(0, 0, 0, 1)
        assert 110_000 < d < 112_000

    def test_zero(self):
        assert haversine_distance(0, 0, 0, 0) == 0.0

    def test_north_pole_to_equator(self):
        # 90 degrees latitude difference ≈ 10_000_000 m (quarter of Earth circumference)
        d = haversine_distance(90, 0, 0, 0)
        assert 9_900_000 < d < 10_100_000


class TestIsWithinRadius:
    def test_same_point(self):
        assert is_within_radius("11.0168,76.9558", "11.0168,76.9558", 50) is True

    def test_within_50m(self):
        # ~11m apart
        assert (
            is_within_radius("11.0168,76.9558", "11.0169,76.9558", 50) is True
        )

    def test_outside_50m(self):
        # ~500m apart → outside 50m
        assert (
            is_within_radius("11.0168,76.9558", "11.0213,76.9558", 50) is False
        )

    def test_outside_custom_radius(self):
        # ~500m apart, radius=1000 → inside
        assert (
            is_within_radius("11.0168,76.9558", "11.0213,76.9558", 1000)
            is True
        )

    def test_invalid_first_coords(self):
        assert (
            is_within_radius("invalid", "11.0168,76.9558", 50) is False
        )

    def test_invalid_second_coords(self):
        assert (
            is_within_radius("11.0168,76.9558", "invalid", 50) is False
        )

    def test_both_invalid(self):
        assert is_within_radius("bad", "also_bad", 50) is False
