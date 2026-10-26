"""User management blueprint: profile and password updates."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import User
from app.security.permissions import current_user
from app.security.validation import ValidationError, validate_password
from app.utils import error_response, success_response

users_bp = Blueprint("users", __name__)


@users_bp.get("/profile")
@jwt_required()
def get_profile():
    user = current_user()
    if user is None:
        return error_response("User not found.", status=404)
    return success_response({"user": user.to_dict()})


@users_bp.patch("/profile")
@jwt_required()
def update_profile():
    user = current_user()
    if user is None:
        return error_response("User not found.", status=404)

    payload = request.get_json(silent=True) or {}
    if "username" in payload:
        from app.security.validation import validate_username

        try:
            username = validate_username(payload["username"])
        except ValidationError as exc:
            return error_response(exc.message, status=422, field=exc.field)
        existing = User.query.filter(User.username == username, User.id != user.id).first()
        if existing:
            return error_response("Username already taken.", status=409)
        user.username = username

    db.session.commit()
    return success_response({"user": user.to_dict()}, message="Profile updated.")


@users_bp.put("/password")
@jwt_required()
def change_password():
    user = current_user()
    if user is None:
        return error_response("User not found.", status=404)

    payload = request.get_json(silent=True) or {}
    current = payload.get("current_password") or ""
    new_password = payload.get("new_password") or ""

    if not user.check_password(current):
        return error_response("Current password is incorrect.", status=403)

    try:
        new_password = validate_password(new_password)
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    user.set_password(new_password)
    db.session.commit()
    return success_response(message="Password updated.")
