"""Generation model for AI-generated outputs (code, images, text)."""
import enum

from app.extensions import db
from app.models.base import TimestampMixin, generate_uuid


class GenerationType(str, enum.Enum):
    TEXT = "text"
    CODE = "code"
    IMAGE = "image"


class GenerationStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Generation(TimestampMixin, db.Model):
    __tablename__ = "generations"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.Enum(GenerationType), nullable=False)
    status = db.Column(db.Enum(GenerationStatus), default=GenerationStatus.PENDING, nullable=False)
    prompt = db.Column(db.Text, nullable=True)
    model = db.Column(db.String(120), nullable=True)
    output = db.Column(db.Text, nullable=True)       # text/code output or image path/URL
    error_message = db.Column(db.Text, nullable=True)
    tokens_used = db.Column(db.Integer, default=0)
    duration_ms = db.Column(db.Integer, nullable=True)
    metadata_json = db.Column("metadata", db.JSON, nullable=True)

    user = db.relationship("User")

    def to_dict(self) -> dict:
        result_url = None
        if self.type == GenerationType.IMAGE and self.output:
            if self.output.startswith("http://") or self.output.startswith("https://") or self.output.startswith("data:"):
                result_url = self.output
            elif self.output.startswith("/"):
                result_url = self.output
            else:
                result_url = f"/api/image-studio/images/{self.output}"

        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type.value if self.type else None,
            "status": self.status.value if self.status else None,
            "prompt": self.prompt,
            "model": self.model,
            "output": self.output,
            "result_url": result_url or self.output,
            "image_url": result_url or self.output,
            "error_message": self.error_message,
            "tokens_used": self.tokens_used,
            "duration_ms": self.duration_ms,
            "metadata": self.metadata_json or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

