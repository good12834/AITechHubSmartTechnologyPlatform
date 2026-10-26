"""Project model for grouping related work."""
from app.extensions import db
from app.models.base import TimestampMixin, generate_uuid


class Project(TimestampMixin, db.Model):
    __tablename__ = "projects"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    owner_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default="active", nullable=False)
    metadata_json = db.Column("metadata", db.JSON, nullable=True)

    owner = db.relationship("User", back_populates="projects")
    conversations = db.relationship("Conversation", back_populates="project", lazy="dynamic")
    documents = db.relationship("Document", back_populates="project", lazy="dynamic")
    workflows = db.relationship("Workflow", back_populates="project", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "owner_id": self.owner_id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "metadata": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
