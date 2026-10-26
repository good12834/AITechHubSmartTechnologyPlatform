"""Chat blueprint: conversations and messaging (incl. streaming)."""
import json

from flask import Blueprint, Response, jsonify, request, stream_with_context
from flask_jwt_extended import jwt_required

from app.models import Conversation
from app.security.permissions import current_user
from app.security.validation import ValidationError, require_non_empty, sanitize_text
from app.services import chat_service
from app.services.chat_service import ChatError
from app.utils import error_response, success_response

chat_bp = Blueprint("chat", __name__)


@chat_bp.get("/conversations")
@jwt_required()
def list_conversations():
    user = current_user()
    include_archived = request.args.get("include_archived", "false").lower() == "true"
    conversations = chat_service.list_conversations(user.id, include_archived=include_archived)
    return success_response({"conversations": [c.to_dict() for c in conversations]})


@chat_bp.post("/conversations")
@jwt_required()
def create_conversation():
    user = current_user()
    payload = request.get_json(silent=True) or {}
    try:
        title = sanitize_text(payload.get("title", "New Conversation"), "title", max_length=255)
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    conversation = chat_service.create_conversation(
        user_id=user.id,
        title=title,
        project_id=payload.get("project_id"),
        model=payload.get("model"),
    )
    return success_response({"conversation": conversation.to_dict()}, status=201)


@chat_bp.get("/conversations/<conversation_id>")
@jwt_required()
def get_conversation(conversation_id):
    user = current_user()
    try:
        conversation = chat_service.get_conversation(conversation_id, user.id)
    except ChatError as exc:
        return error_response(str(exc), status=404)
    return success_response({"conversation": conversation.to_dict(include_messages=True)})


@chat_bp.patch("/conversations/<conversation_id>")
@jwt_required()
def update_conversation(conversation_id):
    user = current_user()
    try:
        conversation = chat_service.get_conversation(conversation_id, user.id)
    except ChatError as exc:
        return error_response(str(exc), status=404)

    payload = request.get_json(silent=True) or {}
    if "title" in payload:
        try:
            conversation.title = sanitize_text(payload["title"], "title", max_length=255)
        except ValidationError as exc:
            return error_response(exc.message, status=422, field=exc.field)
    if "model" in payload:
        conversation.model = payload["model"]
    if "is_archived" in payload:
        conversation.is_archived = bool(payload["is_archived"])
    if "project_id" in payload:
        conversation.project_id = payload["project_id"]

    from app.extensions import db
    db.session.commit()
    return success_response({"conversation": conversation.to_dict()}, message="Conversation updated.")


@chat_bp.delete("/conversations/<conversation_id>")
@jwt_required()
def delete_conversation(conversation_id):
    user = current_user()
    try:
        conversation = chat_service.get_conversation(conversation_id, user.id)
    except ChatError as exc:
        return error_response(str(exc), status=404)
    from app.extensions import db

    db.session.delete(conversation)
    db.session.commit()
    return success_response(message="Conversation deleted.")



@chat_bp.post("/conversations/<conversation_id>/messages")
@jwt_required()
def send_message(conversation_id):
    """Send a user message and receive the assistant's reply.

    Pass ``{"stream": true}`` to receive the reply as Server-Sent Events.
    """
    user = current_user()
    payload = request.get_json(silent=True) or {}

    try:
        content = sanitize_text(payload.get("content", ""), "content", max_length=20000)
        require_non_empty(content, "content")
    except ValidationError as exc:
        return error_response(exc.message, status=422, field=exc.field)

    model = payload.get("model")
    stream = bool(payload.get("stream", False))

    if stream:
        return _stream_reply(conversation_id, user.id, content, model)

    try:
        result = chat_service.send_message(
            conversation_id, user.id, content, model=model, stream=False
        )
    except ChatError as exc:
        status = 404 if "not found" in str(exc).lower() else 400
        return error_response(str(exc), status=status)

    return success_response(result)


def _stream_reply(conversation_id: str, user_id: str, content: str, model) -> Response:
    """Stream the assistant reply as SSE, then persist both turns."""
    import time

    from app.extensions import db
    from app.models import Message, MessageRole, UsageRecord, UsageType
    from app.services.ai.base import ChatMessage
    from app.services.ai.model_manager import resolve_model
    from app.services.ai.registry import get_provider

    try:
        conversation = chat_service.get_conversation(conversation_id, user_id)
    except ChatError as exc:
        return error_response(str(exc), status=404)

    history = [
        ChatMessage(role=m.role.value, content=m.content)
        for m in conversation.messages.all()
    ]
    history.append(ChatMessage(role="user", content=content))

    provider_name, model_name = resolve_model("chat", model or conversation.model)
    provider = get_provider(provider_name)

    def event_stream():
        started = time.monotonic()
        chunks = []
        try:
            for piece in provider.chat_stream(history, model=model_name):
                chunks.append(piece)
                # json.dumps (not jsonify) — the generator may run after the
                # request context is gone, and jsonify needs that context.
                yield f"data: {json.dumps({'delta': piece})}\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            return

        # Persist both turns without re-invoking the provider.
        try:
            duration_ms = int((time.monotonic() - started) * 1000)
            user_msg = Message(
                conversation_id=conversation.id,
                role=MessageRole.USER,
                content=content,
            )
            assistant_msg = Message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content="".join(chunks),
                model=model_name,
                metadata_json={"duration_ms": duration_ms, "provider": provider_name, "streamed": True},
            )
            db.session.add(user_msg)
            db.session.add(assistant_msg)
            db.session.add(UsageRecord(user_id=user_id, type=UsageType.CHAT_MESSAGE, quantity=1))
            if conversation.title == "New Conversation":
                conversation.title = content[:60]
            conversation.model = model_name
            db.session.commit()
        except Exception:  # noqa: BLE001 — never break the stream over persistence
            db.session.rollback()

        yield "event: done\ndata: {}\n\n"

    # stream_with_context keeps the request/app context alive while the
    # generator streams — needed for db.session and provider config access.
    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")
