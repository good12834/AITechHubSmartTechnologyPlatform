"""Celery application entry point.

Run a worker with:
    celery -A celery_worker.celery worker --loglevel=info --pool=solo
"""
import os

from dotenv import load_dotenv

load_dotenv()

from app import create_app  # noqa: E402
from app.extensions import celery, db  # noqa: E402

flask_app = create_app(os.getenv("FLASK_ENV", "development"))

# Make the Flask app context available to tasks via a task base class.
class ContextTask(celery.Task):
    abstract = True

    def __call__(self, *args, **kwargs):
        with flask_app.app_context():
            return self.run(*args, **kwargs)


celery.Task = ContextTask

# Import task modules so Celery registers them on startup.
with flask_app.app_context():
    from app.tasks import document_tasks, image_tasks, cleanup_tasks  # noqa: F401
