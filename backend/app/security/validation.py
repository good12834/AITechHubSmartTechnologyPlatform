"""Input validation helpers (lightweight, dependency-free)."""
import re
from typing import Any

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_.-]{3,80}$")


class ValidationError(Exception):
    """Raised when request input fails validation."""

    def __init__(self, message: str, field: str | None = None):
        super().__init__(message)
        self.field = field
        self.message = message


def require_non_empty(value: Any, field: str, max_length: int | None = None) -> str:
    if value is None or (isinstance(value, str) and not value.strip()):
        raise ValidationError(f"'{field}' is required.", field=field)
    if not isinstance(value, str):
        raise ValidationError(f"'{field}' must be a string.", field=field)
    value = value.strip()
    if max_length is not None and len(value) > max_length:
        raise ValidationError(f"'{field}' must be at most {max_length} characters.", field=field)
    return value


def validate_email(value: str) -> str:
    value = require_non_empty(value, "email", max_length=255).lower()
    if not EMAIL_RE.match(value):
        raise ValidationError("Invalid email address.", field="email")
    return value


def validate_username(value: str) -> str:
    value = require_non_empty(value, "username", max_length=80)
    if not USERNAME_RE.match(value):
        raise ValidationError(
            "Username must be 3-80 characters and may contain letters, numbers, '_', '.', '-'.",
            field="username",
        )
    return value


def validate_password(value: str) -> str:
    if not value or len(value) < 8:
        raise ValidationError("Password must be at least 8 characters.", field="password")
    if len(value) > 128:
        raise ValidationError("Password must be at most 128 characters.", field="password")
    return value


def validate_choice(value: Any, choices: set[str], field: str) -> str:
    if value not in choices:
        raise ValidationError(f"'{field}' must be one of: {', '.join(sorted(choices))}.", field=field)
    return value


def sanitize_text(value: str, field: str = "text", max_length: int = 20000) -> str:
    """Basic sanitization: strip control characters and enforce length."""
    value = require_non_empty(value, field, max_length=max_length)
    # Remove control chars except newline/tab.
    return "".join(ch for ch in value if ch == "\n" or ch == "\t" or ch.isprintable())
