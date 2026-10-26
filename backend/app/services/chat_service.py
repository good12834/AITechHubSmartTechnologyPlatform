"""Chat service: orchestrates conversations and AI responses."""
import time

from app.extensions import db
from app.models import Conversation, Message, MessageRole, UsageRecord, UsageType
from app.services.ai.base import ChatMessage
from app.services.ai.model_manager import resolve_model
from app.services.ai.registry import get_provider


class ChatError(Exception):
    """Raised when a chat operation cannot be completed."""


def get_conversation(conversation_id: str, user_id: str) -> Conversation:
    conversation = db.session.get(Conversation, conversation_id)
    if conversation is None or conversation.user_id != user_id:
        raise ChatError("Conversation not found.")
    return conversation


def list_conversations(user_id: str, include_archived: bool = False):
    query = Conversation.query.filter_by(user_id=user_id)
    if not include_archived:
        query = query.filter_by(is_archived=False)
    return query.order_by(Conversation.updated_at.desc()).all()


def create_conversation(user_id: str, title: str = "New Conversation", project_id: str | None = None,
                        model: str | None = None) -> Conversation:
    conversation = Conversation(user_id=user_id, title=title, project_id=project_id, model=model)
    db.session.add(conversation)
    db.session.commit()
    return conversation


def send_message(conversation_id: str, user_id: str, content: str, model: str | None = None,
                 stream: bool = False, **gen_kwargs) -> dict:
    """Append a user message, call the AI provider, persist the reply."""
    conversation = get_conversation(conversation_id, user_id)
    if not content or not content.strip():
        raise ChatError("Message content cannot be empty.")

    # Persist the user turn.
    user_msg = Message(conversation_id=conversation.id, role=MessageRole.USER, content=content.strip())
    db.session.add(user_msg)

    # Build history for the provider.
    history = [
        ChatMessage(role=m.role.value, content=m.content)
        for m in conversation.messages.order_by(Message.created_at.asc()).all()
    ]
    history.append(ChatMessage(role="user", content=content.strip()))

    provider_name, model_name = resolve_model("chat", model or conversation.model)
    provider = get_provider(provider_name)

    started = time.monotonic()
    if stream:
        # Streaming is handled at the route layer; here we collect for persistence.
        chunks = []
        for piece in provider.chat_stream(history, model=model_name, **gen_kwargs):
            chunks.append(piece)
        result_text = "".join(chunks)
        tokens = 0
        final_model = model_name
    else:
        result = provider.chat(history, model=model_name, **gen_kwargs)
        result_text = result.text
        tokens = result.tokens_used
        final_model = result.model
    duration_ms = int((time.monotonic() - started) * 1000)

    assistant_msg = Message(
        conversation_id=conversation.id,
        role=MessageRole.ASSISTANT,
        content=result_text,
        model=final_model,
        tokens_used=tokens,
        metadata_json={"duration_ms": duration_ms, "provider": provider_name},
    )
    db.session.add(assistant_msg)

    # Track usage.
    db.session.add(
        UsageRecord(user_id=user_id, type=UsageType.CHAT_MESSAGE, quantity=1, tokens=tokens)
    )

    # Auto-title on first exchange.
    if conversation.title == "New Conversation" and content.strip():
        conversation.title = content.strip()[:60]

    conversation.model = final_model
    db.session.commit()

    return {
        "conversation_id": conversation.id,
        "user_message": user_msg.to_dict(),
        "assistant_message": assistant_msg.to_dict(),
    }
