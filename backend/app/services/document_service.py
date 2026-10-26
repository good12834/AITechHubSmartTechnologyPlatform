"""Document service: upload, persistence, and text extraction/chunking."""
import os
import re
import uuid

from flask import current_app
from werkzeug.datastructures import FileStorage

from app.extensions import db
from app.models import Document, DocumentChunk, DocumentStatus


class DocumentError(Exception):
    """Raised when a document operation cannot be completed."""


CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def get_upload_folder() -> str:
    folder = current_app.config.get("UPLOAD_FOLDER", "./uploads")
    os.makedirs(folder, exist_ok=True)
    return folder


def save_upload(file: FileStorage, user_id: str, project_id: str | None = None) -> Document:
    """Persist an uploaded file to disk and create a Document row."""
    if file is None or not file.filename:
        raise DocumentError("No file provided.")

    from app.security.upload_validation import validate_upload

    validate_upload(file)  # raises ValidationError on bad type/size

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    folder = get_upload_folder()
    stored_path = os.path.join(folder, stored_name)
    file.save(stored_path)

    size = os.path.getsize(stored_path)

    document = Document(
        user_id=user_id,
        project_id=project_id,
        filename=file.filename,
        stored_path=stored_path,
        content_type=file.mimetype,
        size_bytes=size,
        status=DocumentStatus.UPLOADED,
    )
    db.session.add(document)
    db.session.commit()

    # Kick off async processing (ingest + chunk).
    from app.tasks.document_tasks import process_document_task

    process_document_task.delay(document.id)

    return document


def extract_text(document: Document) -> str:
    """Best-effort text extraction supporting text files and PDF via pypdf."""
    ext = document.filename.rsplit(".", 1)[-1].lower() if "." in document.filename else ""
    if ext in {"txt", "md", "markdown", "csv", "json", "log"}:
        with open(document.stored_path, "r", encoding="utf-8", errors="replace") as fh:
            return fh.read()
    elif ext == "pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(document.stored_path)
            extracted = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    extracted.append(f"--- Page {i + 1} ---\n{page_text}")
            return "\n\n".join(extracted)
        except Exception as exc:
            raise DocumentError(f"Failed to extract text from PDF: {exc}") from exc
    raise DocumentError(f"Unsupported file type for text extraction: {ext or 'unknown'}")


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks, preferring paragraph boundaries."""
    text = text.strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]

    # Split on paragraph boundaries first.
    paragraphs = re.split(r"\n\s*\n", text)
    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        candidate = (current + "\n\n" + para).strip() if current else para
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current:
                chunks.append(current)
            # Hard-split very large paragraphs.
            while len(para) > chunk_size:
                chunks.append(para[:chunk_size])
                para = para[chunk_size - overlap:]
            current = para
    if current:
        chunks.append(current)
    return chunks


def process_document(document_id: str) -> Document:
    """Extract text, chunk it, persist chunks, and mark the document processed."""
    document = db.session.get(Document, document_id)
    if document is None:
        raise DocumentError(f"Document {document_id} not found.")

    document.status = DocumentStatus.PROCESSING
    db.session.commit()

    try:
        text = extract_text(document)
        chunks = chunk_text(text)

        # Replace any prior chunks (reprocessing).
        DocumentChunk.query.filter_by(document_id=document.id).delete()
        for idx, chunk in enumerate(chunks):
            db.session.add(DocumentChunk(document_id=document.id, chunk_index=idx, content=chunk))

        document.chunk_count = len(chunks)
        document.status = DocumentStatus.PROCESSED
        document.error_message = None
    except Exception as exc:  # noqa: BLE001 — surface any failure on the row
        document.status = DocumentStatus.FAILED
        document.error_message = str(exc)

    db.session.commit()
    return document


def delete_document(document_id: str, user_id: str) -> None:
    document = db.session.get(Document, document_id)
    if document is None or document.user_id != user_id:
        raise DocumentError("Document not found.")
    # Remove the stored file if it exists.
    try:
        if document.stored_path and os.path.exists(document.stored_path):
            os.remove(document.stored_path)
    except OSError:
        pass
    db.session.delete(document)
    db.session.commit()
