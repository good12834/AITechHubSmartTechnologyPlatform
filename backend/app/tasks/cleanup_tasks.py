"""Celery tasks for periodic cleanup (beat-scheduled)."""
import logging
import os
from datetime import timedelta

from app.extensions import celery
from app.models.base import utcnow

logger = logging.getLogger(__name__)


@celery.task(name="cleanup_tasks.cleanup_old_generations")
def cleanup_old_generations(days: int = 90):
    """Delete Generation records older than ``days`` days."""
    from app.extensions import db
    from app.models import Generation

    cutoff = utcnow() - timedelta(days=days)
    deleted = (
        Generation.query.filter(Generation.created_at < cutoff).delete(synchronize_session=False)
    )
    db.session.commit()
    logger.info("Cleanup: deleted %s old generations", deleted)
    return {"deleted": deleted}


@celery.task(name="cleanup_tasks.cleanup_orphaned_files")
def cleanup_orphaned_files():
    """Remove files in the uploads folder with no matching Document row.

    Files are kept for a grace period (1 hour) so in-flight uploads are not
    removed before their Document row is committed.
    """
    from flask import current_app

    from app.extensions import db
    from app.models import Document

    from datetime import datetime, timezone

    folder = current_app.config.get("UPLOAD_FOLDER", "./uploads")
    if not os.path.isdir(folder):
        return {"removed": 0}

    grace_cutoff = datetime.now(timezone.utc).timestamp() - 3600
    referenced = {os.path.basename(d.stored_path) for d in Document.query.with_entities(Document.stored_path).all()}

    removed = 0
    for root, _dirs, files in os.walk(folder):
        for filename in files:
            path = os.path.join(root, filename)
            if filename in referenced:
                continue
            try:
                if os.path.getmtime(path) < grace_cutoff:
                    os.remove(path)
                    removed += 1
            except OSError:
                continue

    logger.info("Cleanup: removed %s orphaned files", removed)
    return {"removed": removed}
