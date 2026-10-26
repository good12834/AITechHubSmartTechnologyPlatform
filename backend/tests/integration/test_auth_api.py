"""Integration tests for the auth blueprint."""
def test_register_success(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "username": "newbie", "password": "Passw0rd!"},
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["success"] is True
    assert "access_token" in body["data"]


def test_register_duplicate_email(client):
    payload = {"email": "dupe@example.com", "username": "first", "password": "Passw0rd!"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    payload["username"] = "second"
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


def test_register_invalid_email(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "username": "abc", "password": "Passw0rd!"},
    )
    assert resp.status_code == 422


def test_login_success(client, user):
    resp = client.post(
        "/api/auth/login", json={"email": user.email, "password": "Str0ngPass!"}
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["data"]["user"]["username"] == user.username
    assert "access_token" in body["data"]


def test_login_wrong_password(client, user):
    resp = client.post(
        "/api/auth/login", json={"email": user.email, "password": "wrongpass"}
    )
    assert resp.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_user(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["data"]["user"]["email"] == "tester@example.com"


def test_refresh_returns_new_token(client, user):
    login = client.post(
        "/api/auth/login", json={"email": user.email, "password": "Str0ngPass!"}
    )
    refresh = login.get_json()["data"]["refresh_token"]
    resp = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {refresh}"})
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()["data"]
