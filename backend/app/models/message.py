"""Message model for chat turns within a conversation."""
import enum

from app.extensions import db
from app.models.base import TimestampMixin, generate_uuid


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(TimestampMixin, db.Model):
    __tablename__ = "messages"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    conversation_id = db.Column(db.String(36), db.ForeignKey("conversations.id"), nullable=False, index=True)
    role = db.Column(db.Enum(MessageRole), nullable=False)
    content = db.Column(db.Text, nullable=False)
    model = db.Column(db.String(120), nullable=True)
    tokens_used = db.Column(db.Integer, default=0)
    metadata_json = db.Column("metadata", db.JSON, nullable=True)

    conversation = db.relationship("Conversation", back_populates="messages")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "role": self.role.value if self.role else None,
            "content": self.content,
            "model": self.model,
            "tokens_used": self.tokens_used,
            "metadata": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
