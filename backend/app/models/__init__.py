"""SQLAlchemy models package.

Importing this package registers all models with the SQLAlchemy metadata,
which is required before running migrations or ``db.create_all()``.
"""
from app.models.base import TimestampMixin, generate_uuid, utcnow  # noqa: F401
from app.models.user import User, UserRole, UserPlan  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message, MessageRole  # noqa: F401
from app.models.document import Document, DocumentChunk, DocumentStatus  # noqa: F401
from app.models.generation import Generation, GenerationType, GenerationStatus  # noqa: F401
from app.models.workflow import Workflow, WorkflowRun, WorkflowStatus, RunStatus  # noqa: F401
from app.models.usage import UsageRecord, UsageType  # noqa: F401

__all__ = [
    "TimestampMixin",
    "generate_uuid",
    "utcnow",
    "User",
    "UserRole",
    "UserPlan",
    "Project",
    "Conversation",
    "Message",
    "MessageRole",
    "Document",
    "DocumentChunk",
    "DocumentStatus",
    "Generation",
    "GenerationType",
    "GenerationStatus",
    "Workflow",
    "WorkflowRun",
    "WorkflowStatus",
    "RunStatus",
    "UsageRecord",
    "UsageType",
]
