"""Workflows blueprint: CRUD + run trigger for automation workflows."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Project, RunStatus, Workflow, WorkflowRun, WorkflowStatus
from app.security.permissions import current_user, require_ownership
from app.security.validation import ValidationError, require_non_empty, sanitize_text
from app.utils import error_response, paginated, success_response

workflows_bp = Blueprint("workflows", __name__)


@workflows_bp.get("")
@jwt_required()
def list_workflows():
    user = current_user()
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    project_id = request.args.get("project_id")

    query = Workflow.query.filter_by(owner_id=user.id)
    if project_id:
        query = query.filter_by(project_id=project_id)

    pagination = query.order_by(Workflow.updated_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return success_response(
        paginated([w.to_dict() for w in pagination.items], page, per_page, pagination.total)
    )


@workflows_bp.post("")
@jwt_required()
def create_workflow():
    user = current_user()
    payload = request.get_json(silent=True) or {}
    try:
        name = sanitize_text(payload.get("name", ""), "name", max_length=255)
        require_non_empty(name, "name")
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    project_id = payload.get("project_id")
    if project_id:
        project = db.session.get(Project, project_id)
        if project is None or project.owner_id != user.id:
            return error_response("Project not found.", status=404)

    workflow = Workflow(
        owner_id=user.id,
        project_id=project_id,
        name=name,
        description=payload.get("description"),
        definition=payload.get("definition", []),
    )
    db.session.add(workflow)
    db.session.commit()
    return success_response({"workflow": workflow.to_dict()}, status=201)


@workflows_bp.get("/<workflow_id>")
@jwt_required()
def get_workflow(workflow_id):
    user = current_user()
    workflow = db.session.get(Workflow, workflow_id)
    if workflow is None:
        return error_response("Workflow not found.", status=404)
    try:
        require_ownership(workflow.owner_id, user)
    except Exception as exc:
        return error_response(str(exc), status=403)
    return success_response({"workflow": workflow.to_dict()})


@workflows_bp.patch("/<workflow_id>")
@jwt_required()
def update_workflow(workflow_id):
    user = current_user()
    workflow = db.session.get(Workflow, workflow_id)
    if workflow is None:
        return error_response("Workflow not found.", status=404)
    try:
        require_ownership(workflow.owner_id, user)
    except Exception as exc:
        return error_response(str(exc), status=403)

    payload = request.get_json(silent=True) or {}
    if "name" in payload:
        try:
            workflow.name = sanitize_text(payload["name"], "name", max_length=255)
        except ValidationError as exc:
            return error_response(exc.message, status=422, field=exc.field)
    if "description" in payload:
        workflow.description = payload["description"]
    if "definition" in payload and isinstance(payload["definition"], list):
        workflow.definition = payload["definition"]
    if "status" in payload:
        try:
            workflow.status = WorkflowStatus(payload["status"])
        except ValueError:
            return error_response("Invalid status.", status=422, field="status")

    db.session.commit()
    return success_response({"workflow": workflow.to_dict()}, message="Workflow updated.")


@workflows_bp.delete("/<workflow_id>")
@jwt_required()
def delete_workflow(workflow_id):
    user = current_user()
    workflow = db.session.get(Workflow, workflow_id)
    if workflow is None:
        return error_response("Workflow not found.", status=404)
    try:
        require_ownership(workflow.owner_id, user)
    except Exception as exc:
        return error_response(str(exc), status=403)

    db.session.delete(workflow)
    db.session.commit()
    return success_response(message="Workflow deleted.")


@workflows_bp.post("/<workflow_id>/run")
@jwt_required()
def run_workflow(workflow_id):
    """Trigger an async run of the workflow via Celery."""
    user = current_user()
    workflow = db.session.get(Workflow, workflow_id)
    if workflow is None:
        return error_response("Workflow not found.", status=404)
    try:
        require_ownership(workflow.owner_id, user)
    except Exception as exc:
        return error_response(str(exc), status=403)

    payload = request.get_json(silent=True) or {}
    run = WorkflowRun(workflow_id=workflow.id, status=RunStatus.QUEUED, input=payload.get("input"))
    db.session.add(run)
    db.session.commit()

    from app.tasks.document_tasks import run_workflow_task  # lazy import avoids cycles

    run_workflow_task.delay(run.id)

    return success_response({"run": run.to_dict()}, message="Workflow run queued.", status=202)


@workflows_bp.get("/<workflow_id>/runs")
@jwt_required()
def list_runs(workflow_id):
    user = current_user()
    workflow = db.session.get(Workflow, workflow_id)
    if workflow is None:
        return error_response("Workflow not found.", status=404)
    try:
        require_ownership(workflow.owner_id, user)
    except Exception as exc:
        return error_response(str(exc), status=403)

    runs = workflow.runs.order_by(WorkflowRun.created_at.desc()).limit(50).all()
    return success_response({"runs": [r.to_dict() for r in runs]})
