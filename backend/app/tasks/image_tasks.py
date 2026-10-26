"""Celery tasks for async image generation."""
import logging
import time

from app.extensions import celery

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=2, default_retry_delay=30, name="image_tasks.generate_image")
def generate_image_task(self, generation_id: str):
    """Run an image generation for an existing pending Generation record."""
    from app.extensions import db
    from app.models import Generation, GenerationStatus
    from app.services.ai.model_manager import resolve_model
    from app.services.ai.registry import get_provider

    record = db.session.get(Generation, generation_id)
    if record is None:
        logger.error("Generation %s not found", generation_id)
        return {"error": "generation not found"}

    record.status = GenerationStatus.RUNNING
    db.session.commit()

    provider_name, model_name = resolve_model("image", record.model)
    provider = get_provider(provider_name)

    started = time.monotonic()
    try:
        result = provider.generate_image(record.prompt or "", model=model_name,
                                         user_id=record.user_id)
        record.output = result.text
        record.tokens_used = result.tokens_used
        record.duration_ms = int((time.monotonic() - started) * 1000)
        record.status = GenerationStatus.COMPLETED
        db.session.commit()
        return {"generation_id": generation_id, "status": record.status.value}
    except Exception as exc:  # noqa: BLE001
        logger.exception("Image generation %s failed", generation_id)
        record.status = GenerationStatus.FAILED
        record.error_message = str(exc)
        db.session.commit()
        raise self.retry(exc=exc)
