"""Usage tracking model for metering AI / storage consumption."""
import enum
from datetime import date

from app.extensions import db
from app.models.base import TimestampMixin, generate_uuid


class UsageType(str, enum.Enum):
    CHAT_MESSAGE = "chat_message"
    CODE_GENERATION = "code_generation"
    IMAGE_GENERATION = "image_generation"
    DOCUMENT_UPLOAD = "document_upload"
    DOCUMENT_PROCESSING = "document_processing"
    RETRIEVAL = "retrieval"
    WORKFLOW_RUN = "workflow_run"


class UsageRecord(TimestampMixin, db.Model):
    __tablename__ = "usage_records"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.Enum(UsageType), nullable=False, index=True)
    quantity = db.Column(db.Integer, default=1)
    tokens = db.Column(db.Integer, default=0)
    # Denormalized date column to make daily rollups cheap.
    recorded_on = db.Column(db.Date, nullable=False, default=date.today, index=True)
    metadata_json = db.Column("metadata", db.JSON, nullable=True)

    user = db.relationship("User", back_populates="usage_records")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type.value if self.type else None,
            "quantity": self.quantity,
            "tokens": self.tokens,
            "recorded_on": self.recorded_on.isoformat() if self.recorded_on else None,
            "metadata": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
