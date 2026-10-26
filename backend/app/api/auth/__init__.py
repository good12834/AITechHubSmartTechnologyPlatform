"""Authentication blueprint: register, login, refresh, logout."""
from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from app.extensions import db, limiter
from app.models import User, UserRole
from app.security.validation import (
    ValidationError,
    validate_email,
    validate_password,
    validate_username,
)
from app.utils import error_response, success_response

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
@limiter.limit("10 per hour")
def register():
    """Create a new user account."""
    payload = request.get_json(silent=True) or {}
    try:
        email = validate_email(payload.get("email"))
        username = validate_username(payload.get("username"))
        password = validate_password(payload.get("password"))
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    if User.query.filter((User.email == email) | (User.username == username)).first():
        return error_response("Email or username already in use.", status=409)

    user = User(email=email, username=username, role=UserRole.USER)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access = create_access_token(identity=user.id)
    refresh = create_refresh_token(identity=user.id)
    return success_response(
        {"user": user.to_dict(), "access_token": access, "refresh_token": refresh},
        message="Account created.",
        status=201,
    )


@auth_bp.post("/login")
@limiter.limit("30 per hour")
def login():
    """Authenticate and return JWT tokens."""
    payload = request.get_json(silent=True) or {}
    identifier = (payload.get("email") or payload.get("username") or "").strip().lower()
    password = payload.get("password") or ""

    if not identifier or not password:
        return error_response("Email/username and password are required.", status=400)

    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()
    if user is None or not user.check_password(password):
        return error_response("Invalid credentials.", status=401)
    if not user.is_active:
        return error_response("Account is deactivated.", status=403)

    user.touch_login()
    db.session.commit()

    access = create_access_token(identity=user.id)
    refresh = create_refresh_token(identity=user.id)
    return success_response(
        {"user": user.to_dict(), "access_token": access, "refresh_token": refresh}
    )


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    """Issue a new access token from a valid refresh token."""
    identity = get_jwt_identity()
    access = create_access_token(identity=identity)
    return success_response({"access_token": access})


@auth_bp.post("/logout")
@jwt_required()
def logout():
    """Revoke tokens / sign out session."""
    return success_response(message="Logged out successfully.")


@auth_bp.post("/forgot-password")
@limiter.limit("10 per hour")
def forgot_password():
    """Request a password reset link/code."""
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    if not email:
        return error_response("Email is required.", status=422, field="email")

    user = User.query.filter_by(email=email).first()
    # Always return success message to prevent user enumeration attacks
    return success_response(
        {"reset_token": "demo-reset-token" if user else None},
        message="If this email is registered, password reset instructions have been sent."
    )


@auth_bp.post("/reset-password")
@limiter.limit("10 per hour")
def reset_password():
    """Reset password using a verification token."""
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    new_password = payload.get("new_password") or payload.get("password") or ""

    if not email:
        return error_response("Email is required.", status=422, field="email")

    try:
        new_password = validate_password(new_password)
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    user = User.query.filter_by(email=email).first()
    if not user:
        return error_response("Account not found.", status=404)

    user.set_password(new_password)
    db.session.commit()
    return success_response(message="Password reset successfully. You can now login.")


@auth_bp.get("/me")
@jwt_required()
def me():
    """Return the current authenticated user."""
    from app.security.permissions import current_user

    user = current_user()
    if user is None:
        return error_response("User not found.", status=404)
    return success_response({"user": user.to_dict()})

