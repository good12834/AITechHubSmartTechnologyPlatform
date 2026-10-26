"""Pytest configuration and shared fixtures."""
import pytest

from app import create_app
from app.extensions import db as _db
from app.models import User


@pytest.fixture(scope="session")
def app():
    """Application fixture configured for testing (in-memory SQLite)."""
    app = create_app("testing")
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope="function")
def db(app):
    """Provide a clean database for each test function."""
    with app.app_context():
        _db.session.remove()
        _db.drop_all()
        _db.create_all()
        yield _db


@pytest.fixture(scope="function")
def client(app, db):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def user(db):
    """A confirmed, active test user with a known password."""
    user = User(email="tester@example.com", username="tester")
    user.set_password("Str0ngPass!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def admin_user(db):
    """An admin test user."""
    from app.models import UserRole

    user = User(email="admin@example.com", username="admin", role=UserRole.ADMIN)
    user.set_password("Adm1nPass!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def auth_headers(client, user):
    """Authorization headers carrying a JWT for the regular test user."""
    resp = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "Str0ngPass!"},
    )
    token = resp.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, admin_user):
    """Authorization headers carrying a JWT for the admin test user."""
    resp = client.post(
        "/api/auth/login",
        json={"email": admin_user.email, "password": "Adm1nPass!"},
    )
    token = resp.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
