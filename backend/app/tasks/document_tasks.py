"""Celery tasks for document processing and workflow runs."""
import logging

from app.extensions import celery
from app.models import RunStatus, WorkflowRun, WorkflowStatus
from app.models.base import utcnow

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=3, default_retry_delay=60, name="document_tasks.process_document")
def process_document_task(self, document_id: str):
    """Extract, chunk, and index an uploaded document."""
    from app.services.document_service import DocumentError, process_document

    try:
        document = process_document(document_id)
        logger.info("Processed document %s: %s chunks", document_id, document.chunk_count)
        return {"document_id": document_id, "status": document.status.value}
    except DocumentError as exc:
        logger.error("Document processing failed for %s: %s", document_id, exc)
        raise self.retry(exc=exc)


@celery.task(bind=True, name="document_tasks.run_workflow")
def run_workflow_task(self, run_id: str):
    """Execute a workflow's steps in order.

    Each step is a dict like ``{"type": "chat" | "code" | "image", "config": {...}}``.
    The output of one step is available to the next via ``previous_output``.
    """
    from app.extensions import db
    from app.services.ai.base import ChatMessage
    from app.services.ai.model_manager import resolve_model
    from app.services.ai.registry import get_provider

    run = db.session.get(WorkflowRun, run_id)
    if run is None:
        logger.error("WorkflowRun %s not found", run_id)
        return {"error": "run not found"}

    run.status = RunStatus.RUNNING
    run.started_at = utcnow()
    db.session.commit()

    workflow = run.workflow
    if workflow is None or workflow.status == WorkflowStatus.ARCHIVED:
        run.status = RunStatus.FAILED
        run.error_message = "Workflow is missing or archived."
        run.finished_at = utcnow()
        db.session.commit()
        return {"error": run.error_message}

    previous_output = None
    steps = workflow.definition or []
    results = []

    try:
        for index, step in enumerate(steps):
            step_type = (step or {}).get("type", "chat")
            config = (step or {}).get("config", {}) or {}
            prompt = config.get("prompt", "")
            if previous_output:
                prompt = f"{prompt}\n\nPrevious output:\n{previous_output}"

            if step_type == "image":
                _, model_name = resolve_model("image", config.get("model"))
                provider = get_provider()
                result = provider.generate_image(prompt, model=model_name)
            elif step_type == "code":
                _, model_name = resolve_model("code", config.get("model"))
                provider = get_provider()
                result = provider.generate(prompt, model=model_name)
            else:  # chat (default)
                _, model_name = resolve_model("chat", config.get("model"))
                provider = get_provider()
                messages = [ChatMessage(role="user", content=prompt)]
                result = provider.chat(messages, model=model_name)

            previous_output = result.text
            results.append({"step": index, "type": step_type, "output": result.text})

        run.status = RunStatus.COMPLETED
        run.output = {"results": results}
        run.finished_at = utcnow()
        db.session.commit()
        return {"run_id": run_id, "status": run.status.value}

    except Exception as exc:  # noqa: BLE001
        logger.exception("Workflow run %s failed", run_id)
        db.session.rollback()
        run = db.session.get(WorkflowRun, run_id)
        run.status = RunStatus.FAILED
        run.error_message = str(exc)
        run.finished_at = utcnow()
        db.session.commit()
        return {"run_id": run_id, "status": run.status.value, "error": str(exc)}
