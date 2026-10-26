"""Shared utility helpers."""
from flask import jsonify


def success_response(data=None, message: str | None = None, status: int = 200, **extra):
    """Build a consistent success JSON response."""
    body = {"success": True}
    if message:
        body["message"] = message
    if data is not None:
        body["data"] = data
    body.update(extra)
    return jsonify(body), status


def error_response(message: str, status: int = 400, code: str | None = None, **extra):
    """Build a consistent error JSON response."""
    body = {"success": False, "error": message}
    if code:
        body["code"] = code
    body.update(extra)
    return jsonify(body), status


def paginated(items: list, page: int, per_page: int, total: int, **extra):
    """Wrap a list of items in a pagination envelope."""
    return {
        "items": items,
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": max(-(-total // per_page), 1) if per_page else 1,
        **extra,
    }
