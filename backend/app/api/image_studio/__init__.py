"""Image Studio blueprint: AI image generation, file serving, and history."""
import os
from flask import Blueprint, current_app, request, send_from_directory
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Generation, GenerationType
from app.security.permissions import current_user
from app.security.validation import ValidationError, require_non_empty, sanitize_text
from app.services import image_service
from app.services.image_service import ImageError
from app.utils import error_response, paginated, success_response

image_bp = Blueprint("image_studio", __name__)


@image_bp.post("/generate")
@jwt_required()
def generate():
    user = current_user()
    payload = request.get_json(silent=True) or {}
    try:
        prompt = sanitize_text(payload.get("prompt", ""), "prompt", max_length=5000)
        require_non_empty(prompt, "prompt")
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    try:
        record = image_service.generate_image(
            user_id=user.id,
            prompt=prompt,
            model=payload.get("model"),
            style=payload.get("style"),
            aspect_ratio=payload.get("aspect_ratio") or payload.get("aspectRatio"),
            seed=payload.get("seed"),
            negative_prompt=payload.get("negative_prompt") or payload.get("negativePrompt"),
        )
    except ImageError as exc:
        return error_response(str(exc), status=502)

    return success_response({"generation": record.to_dict()}, status=201)


@image_bp.get("/generations")
@jwt_required()
def list_generations():
    user = current_user()
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 30, type=int), 100)

    pagination = (
        Generation.query.filter_by(user_id=user.id, type=GenerationType.IMAGE)
        .order_by(Generation.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return success_response(
        paginated([g.to_dict() for g in pagination.items], page, per_page, pagination.total)
    )


@image_bp.get("/generations/<generation_id>")
@jwt_required()
def get_generation(generation_id):
    user = current_user()
    record = db.session.get(Generation, generation_id)
    if record is None or record.user_id != user.id:
        return error_response("Generation not found.", status=404)
    return success_response({"generation": record.to_dict()})


@image_bp.delete("/generations/<generation_id>")
@jwt_required()
def delete_generation(generation_id):
    user = current_user()
    success = image_service.delete_generation(user_id=user.id, generation_id=generation_id)
    if not success:
        return error_response("Generation not found or unauthorized.", status=404)
    return success_response({"deleted": True, "id": generation_id})


@image_bp.get("/images/<path:filename>")
def serve_image(filename):
    """Serve generated visual files (images/SVGs)."""
    cfg = current_app.config.get("UPLOAD_FOLDER", "./uploads")
    if os.path.isabs(cfg):
        base = cfg
    else:
        base = os.path.abspath(os.path.join(current_app.root_path, "..", cfg))
    folder = os.path.join(base, "generated")
    return send_from_directory(folder, filename)

