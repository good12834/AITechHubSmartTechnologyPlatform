"""Workflow models for multi-step automation pipelines."""
import enum

from app.extensions import db
from app.models.base import TimestampMixin, generate_uuid


class WorkflowStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class RunStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Workflow(TimestampMixin, db.Model):
    __tablename__ = "workflows"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=True, index=True)
    owner_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum(WorkflowStatus), default=WorkflowStatus.DRAFT, nullable=False)
    # Definition: ordered list of steps, e.g. [{"type": "chat", "config": {...}}, ...]
    definition = db.Column(db.JSON, nullable=False, default=list)

    owner = db.relationship("User")
    project = db.relationship("Project", back_populates="workflows")
    runs = db.relationship("WorkflowRun", back_populates="workflow", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "project_id": self.project_id,
            "owner_id": self.owner_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "definition": self.definition,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class WorkflowRun(TimestampMixin, db.Model):
    __tablename__ = "workflow_runs"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    workflow_id = db.Column(db.String(36), db.ForeignKey("workflows.id"), nullable=False, index=True)
    status = db.Column(db.Enum(RunStatus), default=RunStatus.QUEUED, nullable=False)
    input = db.Column(db.JSON, nullable=True)
    output = db.Column(db.JSON, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    started_at = db.Column(db.DateTime(timezone=True), nullable=True)
    finished_at = db.Column(db.DateTime(timezone=True), nullable=True)

    workflow = db.relationship("Workflow", back_populates="runs")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "workflow_id": self.workflow_id,
            "status": self.status.value if self.status else None,
            "input": self.input,
            "output": self.output,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
