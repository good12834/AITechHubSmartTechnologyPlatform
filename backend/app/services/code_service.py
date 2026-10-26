"""Code service: AI-assisted code generation and explanation."""
import time

from app.extensions import db
from app.models import Generation, GenerationType, GenerationStatus, UsageRecord, UsageType
from app.services.ai.model_manager import resolve_model
from app.services.ai.registry import get_provider

SYSTEM_PROMPT = (
    "You are an expert software engineer. Generate clean, correct, well-commented code. "
    "When asked to explain, be concise and technical."
)


class CodeError(Exception):
    """Raised when a code generation operation cannot be completed."""


def generate_code(user_id: str, prompt: str, language: str | None = None,
                  model: str | None = None, **gen_kwargs) -> Generation:
    """Run a code-generation request and persist the Generation record."""
    if not prompt or not prompt.strip():
        raise CodeError("Prompt cannot be empty.")

    full_prompt = prompt.strip()
    if language:
        full_prompt = f"Language: {language}\n\n{full_prompt}"

    provider_name, model_name = resolve_model("code", model)
    provider = get_provider(provider_name)

    record = Generation(
        user_id=user_id,
        type=GenerationType.CODE,
        status=GenerationStatus.RUNNING,
        prompt=full_prompt,
        model=model_name,
    )
    db.session.add(record)
    db.session.commit()

    started = time.monotonic()
    try:
        result = provider.generate(full_prompt, model=model_name, **gen_kwargs)
        record.output = result.text
        record.tokens_used = result.tokens_used
        record.status = GenerationStatus.COMPLETED
    except Exception as exc:  # noqa: BLE001
        record.status = GenerationStatus.FAILED
        record.error_message = str(exc)
        db.session.commit()
        raise CodeError(f"Code generation failed: {exc}") from exc

    record.duration_ms = int((time.monotonic() - started) * 1000)
    db.session.add(UsageRecord(user_id=user_id, type=UsageType.CODE_GENERATION,
                               quantity=1, tokens=record.tokens_used))
    db.session.commit()
    return record


def explain_code(user_id: str, code: str, language: str | None = None,
                 model: str | None = None) -> Generation:
    """Ask the model to explain a snippet."""
    prompt = "Explain the following code:\n\n" + code
    return generate_code(user_id, prompt, language=language, model=model)


def improve_code(user_id: str, code: str, instructions: str = "improve it",
                 language: str | None = None, model: str | None = None) -> Generation:
    """Ask the model to refactor/improve a snippet."""
    prompt = f"{instructions.capitalize()} the following code:\n\n{code}"
    return generate_code(user_id, prompt, language=language, model=model)
