"""Document model for uploaded / processed files."""
import enum

from app.extensions import db
from app.models.base import TimestampMixin, generate_uuid


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class Document(TimestampMixin, db.Model):
    __tablename__ = "documents"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=True, index=True)
    filename = db.Column(db.String(255), nullable=False)
    stored_path = db.Column(db.String(500), nullable=False)
    content_type = db.Column(db.String(120), nullable=True)
    size_bytes = db.Column(db.BigInteger, default=0)
    status = db.Column(db.Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    error_message = db.Column(db.Text, nullable=True)
    chunk_count = db.Column(db.Integer, default=0)

    user = db.relationship("User", back_populates="documents")
    project = db.relationship("Project", back_populates="documents")
    chunks = db.relationship("DocumentChunk", back_populates="document", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "filename": self.filename,
            "content_type": self.content_type,
            "size_bytes": self.size_bytes,
            "status": self.status.value if self.status else None,
            "error_message": self.error_message,
            "chunk_count": self.chunk_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DocumentChunk(TimestampMixin, db.Model):
    """A chunk of text from a processed document, used for retrieval (RAG)."""

    __tablename__ = "document_chunks"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    document_id = db.Column(db.String(36), db.ForeignKey("documents.id"), nullable=False, index=True)
    chunk_index = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    # Optional pre-computed embedding stored as JSON list of floats.
    embedding = db.Column(db.JSON, nullable=True)

    document = db.relationship("Document", back_populates="chunks")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_index": self.chunk_index,
            "content": self.content,
        }
