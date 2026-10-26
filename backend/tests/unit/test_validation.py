"""Unit tests for validation helpers."""
import pytest

from app.security.validation import (
    ValidationError,
    validate_email,
    validate_password,
    validate_username,
)


def test_validate_email_accepts_valid():
    assert validate_email("User@Example.com ") == "user@example.com"


@pytest.mark.parametrize("bad", ["", "   ", "not-an-email", "a@b", "@example.com"])
def test_validate_email_rejects_invalid(bad):
    with pytest.raises(ValidationError):
        validate_email(bad)


def test_validate_username_accepts_valid():
    assert validate_username("john_doe-1") == "john_doe-1"


@pytest.mark.parametrize("bad", ["ab", "has spaces!", "x" * 81])
def test_validate_username_rejects_invalid(bad):
    with pytest.raises(ValidationError):
        validate_username(bad)


def test_validate_password_min_length():
    with pytest.raises(ValidationError):
        validate_password("short")


def test_validate_password_accepts_good():
    assert validate_password("Str0ngPass!") == "Str0ngPass!"
