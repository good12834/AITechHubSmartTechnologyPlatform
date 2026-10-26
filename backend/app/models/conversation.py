"""Conversation model for chat sessions."""
from app.extensions import db
from app.models.base import TimestampMixin, generate_uuid


class Conversation(TimestampMixin, db.Model):
    __tablename__ = "conversations"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=True, index=True)
    title = db.Column(db.String(255), nullable=False, default="New Conversation")
    model = db.Column(db.String(120), nullable=True)
    is_archived = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship("User", back_populates="conversations")
    project = db.relationship("Project", back_populates="conversations")
    messages = db.relationship(
        "Message", back_populates="conversation", lazy="dynamic", cascade="all, delete-orphan",
        order_by="Message.created_at.asc()",
    )

    def to_dict(self, include_messages: bool = False) -> dict:
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "title": self.title,
            "model": self.model,
            "is_archived": self.is_archived,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_messages:
            data["messages"] = [m.to_dict() for m in self.messages.all()]
        return data
