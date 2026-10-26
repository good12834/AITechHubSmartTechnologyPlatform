"""Unit tests for the User model's password hashing."""
from app.models import User


def test_set_and_check_password():
    user = User(email="a@b.com", username="alice")
    user.set_password("hunter22")
    assert user.check_password("hunter22") is True
    assert user.check_password("wrong") is False


def test_password_hash_is_not_plaintext():
    user = User(email="a@b.com", username="alice")
    user.set_password("hunter22")
    assert "hunter22" not in user.password_hash
    assert user.password_hash.startswith("$argon2")


def test_is_admin_flag():
    from app.models import UserRole

    regular = User(email="a@b.com", username="a", role=UserRole.USER)
    admin = User(email="c@d.com", username="c", role=UserRole.ADMIN)
    assert regular.is_admin is False
    assert admin.is_admin is True
