"""Abstract base class for AI providers."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import AsyncIterator, Iterator


@dataclass
class ChatMessage:
    role: str  # "system" | "user" | "assistant"
    content: str


@dataclass
class GenerationResult:
    text: str
    model: str
    tokens_used: int = 0
    metadata: dict = field(default_factory=dict)


@dataclass
class ModelInfo:
    name: str
    provider: str
    family: str = ""
    size_bytes: int = 0
    capabilities: list = field(default_factory=list)  # e.g. ["chat"], ["chat","code"], ["vision"]


class AIProvider(ABC):
    """Interface every AI provider (Ollama, OpenAI-compatible, etc.) must implement."""

    #: Unique short name, e.g. "ollama".
    name: str = "base"

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if the provider backend is reachable."""

    @abstractmethod
    def list_models(self) -> list[ModelInfo]:
        """List models available on this provider."""

    @abstractmethod
    def chat(self, messages: list[ChatMessage], model: str | None = None, **kwargs) -> GenerationResult:
        """Run a single (non-streaming) chat completion."""

    @abstractmethod
    def chat_stream(self, messages: list[ChatMessage], model: str | None = None, **kwargs) -> Iterator[str]:
        """Yield chunks of a streaming chat completion."""

    @abstractmethod
    def generate(self, prompt: str, model: str | None = None, **kwargs) -> GenerationResult:
        """Run a raw text generation (used for code completion etc.)."""

    @abstractmethod
    def generate_image(self, prompt: str, model: str | None = None, **kwargs) -> GenerationResult:
        """Generate an image; ``result.text`` holds the file path or URL."""
