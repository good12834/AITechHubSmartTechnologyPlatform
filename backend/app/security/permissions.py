"""Authorization helpers: ownership checks and role guards."""
from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models import User


class AuthorizationError(Exception):
    """Raised when the current user is not permitted to perform an action."""

    def __init__(self, message: str = "Not authorized.", code: int = 403):
        super().__init__(message)
        self.code = code


def current_user() -> User | None:
    """Return the User row for the current JWT identity (or None)."""
    identity = get_jwt_identity()
    if not identity:
        return None
    return User.query.get(identity)


def require_ownership(owner_id: str, user: User) -> None:
    """Ensure ``user`` owns the resource or is an admin; raise otherwise."""
    if user is None:
        raise AuthorizationError("Authentication required.", code=401)
    if user.is_admin:
        return
    if owner_id != user.id:
        raise AuthorizationError("You do not have permission to access this resource.", code=403)


def admin_required(fn):
    """Decorator: require an admin-role JWT for the wrapped route."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = current_user()
        if user is None or not user.is_admin:
            return jsonify({"error": "Admin privileges required."}), 403
        return fn(*args, **kwargs)

    return wrapper


def roles_required(*roles):
    """Decorator factory: require the current user's role to be in ``roles``."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = current_user()
            if user is None:
                return jsonify({"error": "Authentication required."}), 401
            allowed = {r.value if hasattr(r, "value") else r for r in roles}
            if (user.role.value if user.role else "") not in allowed:
                return jsonify({"error": "Insufficient role."}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator
