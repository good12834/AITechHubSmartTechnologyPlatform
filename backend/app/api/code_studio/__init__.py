"""Code Studio blueprint: AI code generation, explanation, improvement."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.security.permissions import current_user
from app.security.validation import ValidationError, require_non_empty, sanitize_text
from app.services import code_service
from app.services.code_service import CodeError
from app.utils import error_response, success_response

code_bp = Blueprint("code_studio", __name__)


@code_bp.post("/generate")
@jwt_required()
def generate():
    user = current_user()
    payload = request.get_json(silent=True) or {}
    try:
        prompt = sanitize_text(payload.get("prompt", ""), "prompt", max_length=20000)
        require_non_empty(prompt, "prompt")
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    try:
        record = code_service.generate_code(
            user_id=user.id,
            prompt=prompt,
            language=payload.get("language"),
            model=payload.get("model"),
        )
    except CodeError as exc:
        return error_response(str(exc), status=502)

    return success_response({"generation": record.to_dict()}, status=201)


@code_bp.post("/explain")
@jwt_required()
def explain():
    user = current_user()
    payload = request.get_json(silent=True) or {}
    try:
        code = sanitize_text(payload.get("code", ""), "code", max_length=50000)
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    try:
        record = code_service.explain_code(
            user_id=user.id, code=code, language=payload.get("language"), model=payload.get("model")
        )
    except CodeError as exc:
        return error_response(str(exc), status=502)

    return success_response({"generation": record.to_dict()}, status=201)


@code_bp.post("/improve")
@jwt_required()
def improve():
    user = current_user()
    payload = request.get_json(silent=True) or {}
    try:
        code = sanitize_text(payload.get("code", ""), "code", max_length=50000)
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    try:
        record = code_service.improve_code(
            user_id=user.id,
            code=code,
            instructions=payload.get("instructions", "improve it"),
            language=payload.get("language"),
            model=payload.get("model"),
        )
    except CodeError as exc:
        return error_response(str(exc), status=502)

    return success_response({"generation": record.to_dict()}, status=201)
