"""Upload validation: enforce allowed extensions, MIME types, and size limits."""
from flask import current_app
from werkzeug.datastructures import FileStorage

from app.security.validation import ValidationError

# Hard block-list of dangerous extensions regardless of config.
BLOCKED_EXTENSIONS = {
    "exe", "bat", "cmd", "com", "scr", "pif", "msi", "dll", "sh", "bash",
    "ps1", "vbs", "js", "jar", "app", "dmg", "pkg", "deb", "rpm",
}

# Max size for a single upload in bytes (independent of app-level limit).
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def validate_upload(file: FileStorage, allowed: set[str] | None = None) -> str:
    """Validate an uploaded file. Returns the lowercase extension on success."""
    if file is None or not file.filename:
        raise ValidationError("No file provided.", field="file")

    ext = _extension(file.filename)
    if not ext:
        raise ValidationError("File must have an extension.", field="file")

    if ext in BLOCKED_EXTENSIONS:
        raise ValidationError(f"File type '.{ext}' is not allowed.", field="file")

    allowed = allowed or current_app.config.get("ALLOWED_EXTENSIONS", set())
    if ext not in allowed:
        raise ValidationError(
            f"File type '.{ext}' is not allowed. Allowed: {', '.join(sorted(allowed))}.",
            field="file",
        )

    # Check size if it is already available on the stream.
    file.stream.seek(0, 2)  # seek to end
    size = file.stream.tell()
    file.stream.seek(0)     # rewind
    if size > MAX_FILE_SIZE:
        raise ValidationError(
            f"File is too large ({size} bytes). Maximum size is {MAX_FILE_SIZE} bytes.",
            field="file",
        )

    return ext
