"""Provider registry for looking up AI providers by name."""
from app.services.ai.base import AIProvider


class ProviderRegistry:
    """A simple registry mapping provider names to instances."""

    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {}

    def register(self, provider: AIProvider) -> None:
        self._providers[provider.name] = provider

    def unregister(self, name: str) -> None:
        self._providers.pop(name, None)

    def get(self, name: str) -> AIProvider | None:
        return self._providers.get(name)

    def names(self) -> list[str]:
        return list(self._providers.keys())

    def all(self) -> list[AIProvider]:
        return list(self._providers.values())


# Module-level singleton used across the app.
registry = ProviderRegistry()


def get_provider(name: str | None = None) -> AIProvider:
    """Return a provider by name, falling back to the first registered one."""
    from flask import current_app

    if name is None:
        name = current_app.config.get("DEFAULT_AI_PROVIDER", "ollama")

    provider = registry.get(name)
    if provider is None:
        available = registry.names()
        if not available:
            raise RuntimeError("No AI providers registered.")
        provider = registry.get(available[0])
    return provider
