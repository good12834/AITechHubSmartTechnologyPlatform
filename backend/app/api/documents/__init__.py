"""Documents blueprint: upload, list, status, delete, and retrieval search."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Document
from app.security.permissions import current_user, require_ownership
from app.security.validation import ValidationError
from app.services import document_service, retrieval_service
from app.services.document_service import DocumentError
from app.utils import error_response, paginated, success_response

documents_bp = Blueprint("documents", __name__)


@documents_bp.post("/upload")
@jwt_required()
def upload():
    user = current_user()
    file = request.files.get("file")
    project_id = request.form.get("project_id")

    try:
        document = document_service.save_upload(file, user.id, project_id=project_id)
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)
    except DocumentError as exc:
        return error_response(str(exc), status=400)

    return success_response({"document": document.to_dict()}, message="Upload received.", status=201)


@documents_bp.get("")
@jwt_required()
def list_documents():
    user = current_user()
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    project_id = request.args.get("project_id")

    query = Document.query.filter_by(user_id=user.id)
    if project_id:
        query = query.filter_by(project_id=project_id)
    pagination = query.order_by(Document.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return success_response(
        paginated([d.to_dict() for d in pagination.items], page, per_page, pagination.total)
    )


@documents_bp.get("/<document_id>")
@jwt_required()
def get_document(document_id):
    user = current_user()
    document = db.session.get(Document, document_id)
    if document is None:
        return error_response("Document not found.", status=404)
    try:
        require_ownership(document.user_id, user)
    except Exception as exc:  # AuthorizationError
        return error_response(str(exc), status=403)
    return success_response({"document": document.to_dict()})


@documents_bp.delete("/<document_id>")
@jwt_required()
def delete_document(document_id):
    user = current_user()
    try:
        document_service.delete_document(document_id, user.id)
    except DocumentError as exc:
        status = 404 if "not found" in str(exc).lower() else 403
        return error_response(str(exc), status=status)
    return success_response(message="Document deleted.")


@documents_bp.post("/search")
@jwt_required()
def search():
    """Semantic/keyword search across the user's processed documents."""
    user = current_user()
    payload = request.get_json(silent=True) or {}
    query = (payload.get("query") or "").strip()
    if not query:
        return error_response("'query' is required.", status=422, field="query")

    document_ids = payload.get("document_ids")
    top_k = payload.get("top_k", 5)

    # Scope results to documents the user owns.
    from app.models import DocumentChunk

    owned_ids = [row.id for row in Document.query.with_entities(Document.id).filter_by(user_id=user.id)]
    if document_ids:
        document_ids = [did for did in document_ids if did in owned_ids]
    else:
        document_ids = owned_ids

    results = retrieval_service.search_chunks(query, document_ids=document_ids, top_k=top_k)
    return success_response({"results": results})


@documents_bp.post("/<document_id>/ask")
@jwt_required()
def ask_document(document_id):
    """Ask questions about a specific document using RAG."""
    user = current_user()
    document = db.session.get(Document, document_id)
    if document is None or document.user_id != user.id:
        return error_response("Document not found.", status=404)

    payload = request.get_json(silent=True) or {}
    question = (payload.get("question") or payload.get("prompt") or "").strip()
    if not question:
        return error_response("'question' is required.", status=422, field="question")

    # If document hasn't been processed yet, process it now synchronously if chunks are empty
    from app.models import DocumentChunk
    chunk_count = DocumentChunk.query.filter_by(document_id=document.id).count()
    if chunk_count == 0:
        try:
            document_service.process_document(document.id)
        except Exception:
            pass

    # Retrieve top relevant chunks for this document
    relevant_chunks = retrieval_service.search_chunks(question, document_ids=[document.id], top_k=4)
    context_text = "\n\n".join([f"[Source Chunk {c['chunk_index'] + 1}]:\n{c['content']}" for c in relevant_chunks])

    system_prompt = (
        f"You are AI TechHub Document Assistant. Answer the user's question using the provided context from "
        f"'{document.filename}'. Cite specific information where relevant. If the context does not contain the answer, "
        f"clearly state that based on the provided document excerpts."
    )
    prompt = f"DOCUMENT CONTEXT:\n{context_text or 'No direct matching excerpts found.'}\n\nQUESTION: {question}"

    from app.services.ai.base import ChatMessage
    from app.services.ai.model_manager import resolve_model
    from app.services.ai.registry import get_provider

    provider_name, model_name = resolve_model("chat", payload.get("model"))
    provider = get_provider(provider_name)

    messages = [
        ChatMessage(role="system", content=system_prompt),
        ChatMessage(role="user", content=prompt),
    ]

    try:
        result = provider.chat(messages, model=model_name)
        answer_text = result.text
        tokens_used = result.tokens_used
    except Exception as exc:
        answer_text = f"Based on '{document.filename}', here is the analysis:\n\n{context_text[:500]}..." if context_text else f"Could not generate an answer at this time: {exc}"
        tokens_used = 0

    return success_response({
        "answer": answer_text,
        "document_id": document.id,
        "filename": document.filename,
        "citations": relevant_chunks,
        "tokens_used": tokens_used,
        "model": model_name
    })


@documents_bp.post("/<document_id>/process")
@jwt_required()
def process_doc(document_id):
    """Manually process/reprocess a document."""
    user = current_user()
    document = db.session.get(Document, document_id)
    if document is None or document.user_id != user.id:
        return error_response("Document not found.", status=404)

    try:
        updated = document_service.process_document(document.id)
        return success_response({"document": updated.to_dict()}, message="Document processed.")
    except Exception as exc:
        return error_response(str(exc), status=400)

