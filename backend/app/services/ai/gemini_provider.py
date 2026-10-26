"""Gemini AI provider implementation.

Talks to Google's Generative Language REST API (v1beta):
https://ai.google.dev/api/generate-content

Uses ``requests`` (already a backend dependency), so no new packages are
required. Supports:

- Non-streaming chat / text generation (``:generateContent``)
- Streaming chat (``:streamGenerateContent`` with Server-Sent Events)
- Model failover chain (``GEMINI_FALLBACK_MODELS``) — free-tier quota is metered
  PER MODEL, so switching models keeps real AI answers flowing.
- TTL response cache for identical prompts (``GEMINI_CACHE_TTL_MS``).
"""
import hashlib
import json
import threading
import time
from typing import Iterator

import requests
from flask import current_app

from app.services.ai.base import (
    AIProvider,
    ChatMessage,
    GenerationResult,
    ModelInfo,
)

_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Roles accepted by the Gemini API ("user" | "model"); anything else maps to "user".
_GEMINI_ROLE_MAP = {"assistant": "model", "ai": "model", "model": "model"}

# Transient / quota statuses worth retrying on the NEXT model in the chain.
_FAILOVER_STATUS = {404, 429, 500, 503}


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        timeout_ms: int | None = None,
        fallback_models: list[str] | None = None,
        cache_ttl_ms: int | None = None,
    ):
        self.api_key = api_key or ""
        self.model = model or "gemini-2.5-flash"
        self.timeout_s = (timeout_ms or 30000) / 1000.0
        self.fallback_models = list(fallback_models or [])
        self.cache_ttl_s = (cache_ttl_ms or 300000) / 1000.0
        self._cache: dict[str, tuple[float, GenerationResult]] = {}
        self._cache_lock = threading.Lock()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _config_defaults(self) -> None:
        """Pull live config from the Flask app when available."""
        try:
            self.api_key = current_app.config.get("GEMINI_API_KEY", self.api_key) or ""
            self.model = current_app.config.get("GEMINI_MODEL", self.model) or self.model
            self.timeout_s = (
                current_app.config.get("GEMINI_TIMEOUT_MS", int(self.timeout_s * 1000)) or 30000
            ) / 1000.0
            self.fallback_models = list(
                current_app.config.get("GEMINI_FALLBACK_MODELS", self.fallback_models) or []
            )
            self.cache_ttl_s = (
                current_app.config.get("GEMINI_CACHE_TTL_MS", int(self.cache_ttl_s * 1000)) or 300000
            ) / 1000.0
        except RuntimeError:
            # Outside app context (e.g. CLI / tests) — keep constructor values.
            pass

    def _headers(self) -> dict:
        # Key sent via header (not query string) so it never lands in server logs.
        return {"x-goog-api-key": self.api_key, "Content-Type": "application/json"}

    def _model_chain(self, model: str | None) -> list[str]:
        """Primary model first, then the configured fallback models (deduped)."""
        chain: list[str] = []
        for m in (model or self.model, *self.fallback_models):
            if m and m not in chain:
                chain.append(m)
        return chain

    @staticmethod
    def _generation_config(kwargs: dict) -> dict:
        """Map generic kwargs (Ollama-style names) to Gemini generationConfig."""
        cfg = {}
        mapping = {
            "temperature": "temperature",
            "top_p": "topP",
            "top_k": "topK",
            "seed": "seed",
            "num_predict": "maxOutputTokens",
            "max_tokens": "maxOutputTokens",
        }
        for src, dst in mapping.items():
            if kwargs.get(src) is not None:
                cfg[dst] = kwargs[src]
        return cfg

    @staticmethod
    def _to_contents(messages: list[ChatMessage]) -> tuple[list[dict], dict | None]:
        """Split chat messages into Gemini ``contents`` + optional ``systemInstruction``."""
        contents: list[dict] = []
        system_parts: list[dict] = []
        for m in messages:
            if m.role == "system":
                system_parts.append({"text": m.content})
                continue
            role = _GEMINI_ROLE_MAP.get(m.role, "user")
            contents.append({"role": role, "parts": [{"text": m.content}]})
        system_instruction = {"parts": system_parts} if system_parts else None
        return contents, system_instruction

    @staticmethod
    def _extract_text(data: dict) -> str:
        candidates = data.get("candidates") or [{}]
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(p.get("text") or "" for p in parts)

    def _to_result(self, data: dict, model: str) -> GenerationResult:
        usage = data.get("usageMetadata", {}) or {}
        candidates = data.get("candidates") or [{}]
        return GenerationResult(
            text=self._extract_text(data),
            model=data.get("modelVersion") or model,
            tokens_used=usage.get("totalTokenCount", 0),
            metadata={
                "finish_reason": candidates[0].get("finishReason"),
                "prompt_tokens": usage.get("promptTokenCount", 0),
                "output_tokens": usage.get("candidatesTokenCount", 0),
            },
        )

    # ------------------------------------------------------------------
    # Response cache (identical prompts within GEMINI_CACHE_TTL_MS)
    # ------------------------------------------------------------------
    def _cache_key(self, kind: str, model: str, payload_obj) -> str:
        blob = json.dumps({"kind": kind, "model": model, "body": payload_obj}, sort_keys=True)
        return hashlib.sha256(blob.encode("utf-8")).hexdigest()

    def _cache_get(self, key: str) -> GenerationResult | None:
        if self.cache_ttl_s <= 0:
            return None
        with self._cache_lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            ts, result = entry
            if time.monotonic() - ts > self.cache_ttl_s:
                self._cache.pop(key, None)
                return None
            return GenerationResult(
                text=result.text,
                model=result.model,
                tokens_used=result.tokens_used,
                metadata={**result.metadata, "cache_hit": True},
            )

    def _cache_put(self, key: str, result: GenerationResult) -> None:
        if self.cache_ttl_s <= 0:
            return
        with self._cache_lock:
            if len(self._cache) >= 128:
                # Evict the oldest entry to bound memory.
                oldest = min(self._cache, key=lambda k: self._cache[k][0])
                self._cache.pop(oldest, None)
            self._cache[key] = (time.monotonic(), result)

    # ------------------------------------------------------------------
    # Core HTTP with model failover
    # ------------------------------------------------------------------
    def _post_with_failover(self, path_fmt: str, payload: dict, models: list[str]) -> tuple[dict, str]:
        """POST ``path_fmt.format(model=m)`` trying each model in the chain.

        Returns ``(response_json, model_used)``. Raises the LAST error if every
        model in the chain failed.
        """
        last_error: Exception | None = None
        for m in models:
            url = f"{_API_BASE}{path_fmt.format(model=m)}"
            try:
                resp = requests.post(url, json=payload, headers=self._headers(), timeout=self.timeout_s)
                if resp.status_code in _FAILOVER_STATUS:
                    last_error = requests.HTTPError(
                        f"{resp.status_code} for model '{m}': {resp.text[:200]}"
                    )
                    continue
                resp.raise_for_status()
                return resp.json(), m
            except requests.RequestException as exc:  # network / timeout / HTTP error
                last_error = exc
                continue
        raise last_error or RuntimeError("No Gemini models configured.")

    # ------------------------------------------------------------------
    # AIProvider interface
    # ------------------------------------------------------------------
    def is_available(self) -> bool:
        self._config_defaults()
        if not self.api_key:
            return False
        try:
            resp = requests.get(f"{_API_BASE}/models", headers=self._headers(), timeout=5)
            return resp.status_code == 200
        except requests.RequestException:
            return False

    def list_models(self) -> list[ModelInfo]:
        self._config_defaults()
        if self.api_key:
            try:
                resp = requests.get(f"{_API_BASE}/models", headers=self._headers(), timeout=10)
                resp.raise_for_status()
                models: list[ModelInfo] = []
                for m in resp.json().get("models", []):
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" not in methods:
                        continue
                    short = m.get("name", "").removeprefix("models/")
                    if not short:
                        continue
                    capabilities = ["chat", "code"]
                    if any(v in short for v in ("flash", "pro", "vision", "ultra")):
                        capabilities.append("vision")
                    models.append(
                        ModelInfo(
                            name=short,
                            provider=self.name,
                            family=short.split("-")[0],
                            size_bytes=0,
                            capabilities=capabilities,
                        )
                    )
                if models:
                    return models
            except Exception:
                pass

        # Offline catalog: the configured chain itself.
        return [
            ModelInfo(name=m, provider=self.name, family="gemini", capabilities=["chat", "code"])
            for m in self._model_chain(None)
        ]

    def chat(self, messages: list[ChatMessage], model: str | None = None, **kwargs) -> GenerationResult:
        self._config_defaults()
        chain = self._model_chain(model)
        contents, system_instruction = self._to_contents(messages)
        gen_cfg = self._generation_config(kwargs)
        payload: dict = {"contents": contents}
        if system_instruction:
            payload["systemInstruction"] = system_instruction
        if gen_cfg:
            payload["generationConfig"] = gen_cfg

        key = self._cache_key("chat", chain[0], payload)
        cached = self._cache_get(key)
        if cached is not None:
            return cached

        try:
            data, used_model = self._post_with_failover(
                "/models/{model}:generateContent", payload, chain
            )
            result = self._to_result(data, used_model)
        except Exception as exc:
            return self._offline_result(chain[0], task="chat", error=exc)

        self._cache_put(key, result)
        return result

    def chat_stream(self, messages: list[ChatMessage], model: str | None = None, **kwargs) -> Iterator[str]:
        self._config_defaults()
        chain = self._model_chain(model)
        contents, system_instruction = self._to_contents(messages)
        gen_cfg = self._generation_config(kwargs)
        payload: dict = {"contents": contents}
        if system_instruction:
            payload["systemInstruction"] = system_instruction
        if gen_cfg:
            payload["generationConfig"] = gen_cfg

        last_error: Exception | None = None
        for m in chain:
            url = f"{_API_BASE}/models/{m}:streamGenerateContent"
            try:
                with requests.post(
                    url,
                    json=payload,
                    headers=self._headers(),
                    params={"alt": "sse"},
                    stream=True,
                    timeout=self.timeout_s,
                ) as resp:
                    if resp.status_code in _FAILOVER_STATUS:
                        last_error = requests.HTTPError(
                            f"{resp.status_code} for model '{m}': {resp.text[:200]}"
                        )
                        continue
                    resp.raise_for_status()
                    emitted = False
                    for line in resp.iter_lines():
                        if not line or not line.startswith(b"data:"):
                            continue
                        chunk = json.loads(line[5:].strip().decode("utf-8"))
                        piece = self._extract_text(chunk)
                        if piece:
                            emitted = True
                            yield piece
                    if emitted:
                        return
            except Exception as exc:
                last_error = exc
                continue

        # All models in the chain failed — degrade gracefully word-by-word.
        fallback = self._offline_text(chain[0], task="chat", error=last_error)
        words = fallback.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")

    def generate(self, prompt: str, model: str | None = None, **kwargs) -> GenerationResult:
        self._config_defaults()
        chain = self._model_chain(model)
        gen_cfg = self._generation_config(kwargs)
        payload: dict = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}
        if gen_cfg:
            payload["generationConfig"] = gen_cfg

        key = self._cache_key("generate", chain[0], payload)
        cached = self._cache_get(key)
        if cached is not None:
            return cached

        try:
            data, used_model = self._post_with_failover(
                "/models/{model}:generateContent", payload, chain
            )
            result = self._to_result(data, used_model)
        except Exception as exc:
            return self._offline_result(chain[0], task="code", error=exc)

        self._cache_put(key, result)
        return result

    def generate_image(self, prompt: str, model: str | None = None, **kwargs) -> GenerationResult:
        """Gemini text models cannot rasterise images.

        Delegate to the local Ollama vision model when it is running; otherwise
        return a descriptive placeholder so Image Studio keeps working.
        """
        self._config_defaults()
        try:
            from app.services.ai.registry import registry

            ollama = registry.get("ollama")
            if ollama is not None and ollama.is_available():
                return ollama.generate_image(prompt, **kwargs)
        except Exception:
            pass
        return GenerationResult(
            text=(
                f"AI Visual Concept generated for prompt: '{prompt}'. "
                "Visual features: high resolution, cinematic lighting, dark violet and cyan accents. "
                "(Gemini is a text model — start Ollama with llava for real image synthesis.)"
            ),
            model=f"{model or self.model} (text-only)",
            tokens_used=45,
            metadata={"status": "placeholder"},
        )

    # ------------------------------------------------------------------
    # Offline degradation (mirrors OllamaProvider behaviour)
    # ------------------------------------------------------------------
    @staticmethod
    def _offline_text(model: str, task: str, error: Exception | None) -> str:
        detail = f" ({error})" if error else ""
        if task == "code":
            return (
                "### 🚀 AI TechHub Code Assistant\n\n"
                f"The Gemini API could not be reached for model `{model}`{detail}.\n\n"
                "Please check GEMINI_API_KEY, network access, and model availability, "
                "then retry your request."
            )
        return (
            "### 🤖 AI TechHub Assistant\n\n"
            f"The Gemini API could not be reached for model `{model}`{detail}.\n\n"
            "Please check GEMINI_API_KEY, network access, and model availability, "
            "then retry your message."
        )

    def _offline_result(self, model: str, task: str, error: Exception | None) -> GenerationResult:
        text = self._offline_text(model, task=task, error=error)
        return GenerationResult(
            text=text,
            model=f"{model} (offline)",
            tokens_used=len(text.split()),
            metadata={"done_reason": "all_models_failed", "error": str(error) if error else None},
        )


