"""Unit tests for the Gemini AI provider (HTTP fully mocked — no quota used)."""
import json

import pytest
import requests

from app.services.ai.base import ChatMessage
from app.services.ai.gemini_provider import GeminiProvider


class _FakeResponse:
    def __init__(self, status_code=200, payload=None, text="", sse_lines=None):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = text or json.dumps(self._payload)
        self._sse_lines = sse_lines or []

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} error")

    def iter_lines(self):
        for line in self._sse_lines:
            yield line

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


@pytest.fixture
def provider():
    return GeminiProvider(
        api_key="test-key",
        model="gemini-3.5-flash-lite",
        timeout_ms=1000,
        fallback_models=["gemini-flash-lite-latest", "gemini-2.5-flash"],
        cache_ttl_ms=300000,
    )


def test_is_available_without_key(monkeypatch):
    # Neutralise app-config override: the session-wide Flask app may carry a
    # real GEMINI_API_KEY from .env, but an empty-key provider must be offline.
    monkeypatch.setattr(GeminiProvider, "_config_defaults", lambda self: None)
    assert GeminiProvider(api_key="").is_available() is False


def test_is_available_success(monkeypatch):
    seen = {}

    def fake_get(url, headers=None, timeout=None):
        seen["headers"] = headers
        return _FakeResponse(200, {"models": []})

    monkeypatch.setattr(requests, "get", fake_get)
    p = GeminiProvider(api_key="test-key")
    # When running inside a Flask app context (full suite), _config_defaults()
    # may pull the real key from app config — compare against the live value.
    assert p.is_available() is True
    assert seen["headers"]["x-goog-api-key"] == p.api_key


def test_chat_success_and_caching(monkeypatch, provider):
    calls = []

    def fake_post(url, json=None, headers=None, timeout=None, **kwargs):
        calls.append(url)
        return _FakeResponse(
            200,
            {
                "candidates": [{"content": {"parts": [{"text": "Hello!"}]}, "finishReason": "STOP"}],
                "usageMetadata": {"totalTokenCount": 12},
            },
        )

    monkeypatch.setattr(requests, "post", fake_post)
    msgs = [ChatMessage(role="user", content="Hi")]

    result = provider.chat(msgs)
    assert result.text == "Hello!"
    assert result.tokens_used == 12
    assert "gemini-3.5-flash-lite" in calls[0]

    # Second identical call must be served from cache (no extra HTTP call).
    result2 = provider.chat(msgs)
    assert result2.text == "Hello!"
    assert result2.metadata.get("cache_hit") is True
    assert len(calls) == 1


def test_failover_to_next_model_on_429(monkeypatch, provider):
    calls = []

    def fake_post(url, json=None, headers=None, timeout=None, **kwargs):
        calls.append(url)
        if "gemini-3.5-flash-lite" in url:
            return _FakeResponse(429, {}, text="quota exceeded")
        return _FakeResponse(
            200,
            {
                "candidates": [{"content": {"parts": [{"text": "fallback answer"}]}}],
                "usageMetadata": {"totalTokenCount": 5},
            },
        )

    monkeypatch.setattr(requests, "post", fake_post)
    result = provider.chat([ChatMessage(role="user", content="Hi")])
    assert result.text == "fallback answer"
    assert len(calls) == 2  # primary failed, first fallback succeeded


def test_offline_result_when_all_models_fail(monkeypatch, provider):
    def fake_post(url, json=None, headers=None, timeout=None, **kwargs):
        raise requests.ConnectionError("network down")

    monkeypatch.setattr(requests, "post", fake_post)
    result = provider.chat([ChatMessage(role="user", content="Hi")])
    assert "could not be reached" in result.text
    assert result.metadata["done_reason"] == "all_models_failed"


def test_system_message_becomes_system_instruction():
    contents, system = GeminiProvider._to_contents(
        [
            ChatMessage(role="system", content="Be terse."),
            ChatMessage(role="user", content="Hi"),
            ChatMessage(role="assistant", content="Hello"),
        ]
    )
    assert system == {"parts": [{"text": "Be terse."}]}
    assert contents == [
        {"role": "user", "parts": [{"text": "Hi"}]},
        {"role": "model", "parts": [{"text": "Hello"}]},
    ]


def test_chat_stream_yields_chunks(monkeypatch, provider):
    payload = {
        "candidates": [{"content": {"parts": [{"text": "World"}]}}]
    }
    sse = [b'data: ' + json.dumps(payload).encode("utf-8")]

    def fake_post(url, json=None, headers=None, timeout=None, stream=False, params=None, **kwargs):
        assert params == {"alt": "sse"}
        assert "streamGenerateContent" in url
        return _FakeResponse(200, sse_lines=sse)

    monkeypatch.setattr(requests, "post", fake_post)
    chunks = list(provider.chat_stream([ChatMessage(role="user", content="Hi")]))
    assert chunks == ["World"]


def test_generate_image_placeholder_when_ollama_down(monkeypatch, provider):
    # Ollama not registered → provider returns a descriptive placeholder.
    result = provider.generate_image("a red cube")
    assert "AI Visual Concept" in result.text
    assert result.metadata["status"] == "placeholder"


def test_list_models_offline_catalog(monkeypatch, provider):
    def fake_get(url, headers=None, timeout=None):
        raise requests.ConnectionError("no network")

    monkeypatch.setattr(requests, "get", fake_get)
    models = provider.list_models()
    names = [m.name for m in models]
    assert "gemini-3.5-flash-lite" in names
    assert "gemini-2.5-flash" in names
    assert all(m.provider == "gemini" for m in models)
