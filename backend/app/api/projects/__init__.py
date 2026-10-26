"""Projects blueprint: CRUD for user projects."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Project
from app.security.permissions import current_user, require_ownership
from app.security.validation import ValidationError, require_non_empty, sanitize_text
from app.utils import error_response, paginated, success_response

projects_bp = Blueprint("projects", __name__)


@projects_bp.get("")
@jwt_required()
def list_projects():
    user = current_user()
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)

    pagination = (
        Project.query.filter_by(owner_id=user.id)
        .order_by(Project.updated_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return success_response(
        paginated([p.to_dict() for p in pagination.items], page, per_page, pagination.total)
    )


@projects_bp.post("")
@jwt_required()
def create_project():
    user = current_user()
    payload = request.get_json(silent=True) or {}
    try:
        name = sanitize_text(payload.get("name", ""), "name", max_length=255)
        require_non_empty(name, "name")
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    project = Project(
        owner_id=user.id,
        name=name,
        description=payload.get("description"),
        metadata_json=payload.get("metadata"),
    )
    db.session.add(project)
    db.session.commit()
    return success_response({"project": project.to_dict()}, status=201)


@projects_bp.get("/<project_id>")
@jwt_required()
def get_project(project_id):
    user = current_user()
    project = db.session.get(Project, project_id)
    if project is None:
        return error_response("Project not found.", status=404)
    try:
        require_ownership(project.owner_id, user)
    except Exception as exc:
        return error_response(str(exc), status=403)
    return success_response({"project": project.to_dict()})


@projects_bp.patch("/<project_id>")
@jwt_required()
def update_project(project_id):
    user = current_user()
    project = db.session.get(Project, project_id)
    if project is None:
        return error_response("Project not found.", status=404)
    try:
        require_ownership(project.owner_id, user)
    except Exception as exc:
        return error_response(str(exc), status=403)

    payload = request.get_json(silent=True) or {}
    if "name" in payload:
        try:
            project.name = sanitize_text(payload["name"], "name", max_length=255)
        except ValidationError as exc:
            return error_response(exc.message, status=422, field=exc.field)
    if "description" in payload:
        project.description = payload["description"]
    if "status" in payload:
        project.status = payload["status"]
    if "metadata" in payload:
        project.metadata_json = payload["metadata"]

    db.session.commit()
    return success_response({"project": project.to_dict()}, message="Project updated.")


@projects_bp.delete("/<project_id>")
@jwt_required()
def delete_project(project_id):
    user = current_user()
    project = db.session.get(Project, project_id)
    if project is None:
        return error_response("Project not found.", status=404)
    try:
        require_ownership(project.owner_id, user)
    except Exception as exc:
        return error_response(str(exc), status=403)

    db.session.delete(project)
    db.session.commit()
    return success_response(message="Project deleted.")
