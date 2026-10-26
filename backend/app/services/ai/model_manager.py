"""Model manager: high-level API for discovering and selecting AI models."""
from flask import current_app

from app.services.ai.base import ModelInfo
from app.services.ai.registry import get_provider, registry


def ensure_default_providers() -> None:
    """Register built-in providers on the singleton registry (idempotent)."""
    if registry.get("ollama") is None:
        from app.services.ai.ollama_provider import OllamaProvider

        try:
            base_url = current_app.config.get("OLLAMA_BASE_URL")
            timeout = current_app.config.get("AI_REQUEST_TIMEOUT")
        except RuntimeError:
            base_url = timeout = None
        registry.register(OllamaProvider(base_url=base_url, timeout=timeout))

    if registry.get("gemini") is None:
        from app.services.ai.gemini_provider import GeminiProvider

        try:
            api_key = current_app.config.get("GEMINI_API_KEY", "")
            model = current_app.config.get("GEMINI_MODEL", None)
            timeout_ms = current_app.config.get("GEMINI_TIMEOUT_MS", None)
            fallbacks = current_app.config.get("GEMINI_FALLBACK_MODELS", None)
            cache_ttl = current_app.config.get("GEMINI_CACHE_TTL_MS", None)
        except RuntimeError:
            import os

            api_key = os.getenv("GEMINI_API_KEY", "")
            model = os.getenv("GEMINI_MODEL") or os.getenv("AI_MODEL") or None
            timeout_ms = int(os.getenv("GEMINI_TIMEOUT_MS", "30000"))
            fallbacks = [
                m.strip()
                for m in os.getenv("GEMINI_FALLBACK_MODELS", "").split(",")
                if m.strip()
            ] or None
            cache_ttl = int(os.getenv("GEMINI_CACHE_TTL_MS", "300000"))
        if api_key:
            registry.register(
                GeminiProvider(
                    api_key=api_key,
                    model=model,
                    timeout_ms=timeout_ms,
                    fallback_models=fallbacks,
                    cache_ttl_ms=cache_ttl,
                )
            )

    if registry.get("stability") is None:
        from app.services.ai.stability_provider import StabilityAIProvider

        try:
            api_key = current_app.config.get("STABILITY_API_KEY", "")
        except RuntimeError:
            import os

            api_key = os.getenv("STABILITY_API_KEY", "")

        if api_key:
            registry.register(
                StabilityAIProvider(api_key=api_key)
            )


def list_all_models() -> list[ModelInfo]:
    """Aggregate models from every available provider."""
    ensure_default_providers()
    models: list[ModelInfo] = []
    for provider in registry.all():
        if provider.is_available():
            models.extend(provider.list_models())
    return models


def resolve_model(role: str, requested: str | None = None) -> tuple[str, str]:
    """Resolve a model for a given role ("chat" | "code" | "image").

    Returns a ``(provider_name, model_name)`` tuple.
    """
    ensure_default_providers()
    role = (role or "chat").lower()

    # Image generation is provider-specific. Route requests for known Stability
    # AI models to the Stability AI provider; anything else falls back to Ollama
    # (which degrades gracefully to Pollinations / procedural vector artwork).
    if role == "image":
        stability = get_provider("stability")
        stability_available = stability is not None and stability.is_available()
        stability_names = {
            m.name for m in (stability.list_models() if stability_available else [])
        }
        if requested:
            if requested in stability_names and stability_available:
                return "stability", requested
            return "ollama", requested
        if stability_available:
            return "stability", "stable-image-core"
        return "ollama", _config("OLLAMA_DEFAULT_IMAGE_MODEL", "llava")

    provider = get_provider()

    if requested:
        return provider.name, requested

    if provider.name == "gemini":
        # Cloud Gemini: chat/code share the configured Gemini model.
        model = _config("AI_MODEL", "") or _config("GEMINI_MODEL", "gemini-2.5-flash")
        return provider.name, model

    if role == "code":
        model = _config("OLLAMA_DEFAULT_CODE_MODEL", "qwen2.5-coder")
    else:
        model = _config("OLLAMA_DEFAULT_CHAT_MODEL", "llama3.1")
    return provider.name, model


def is_provider_available(name: str | None = None) -> bool:
    ensure_default_providers()
    provider = get_provider(name)
    return provider.is_available() if provider else False


def _config(key: str, default: str) -> str:
    try:
        return current_app.config.get(key, default)
    except RuntimeError:
        return default
