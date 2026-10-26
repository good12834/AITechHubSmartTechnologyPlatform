"""Stability AI provider: text-to-image via the Stable Image Core endpoint.

Endpoint: POST https://api.stability.ai/v2beta/stable-image/generate/core
Multipart request; returns raw image bytes.

Quota: flat rate of 3 credits per successful generation.
"""

import logging
import os
import uuid
from typing import Any

import requests
from app.services.image_service import save_image_bytes
from app.services.ai.base import AIProvider, GenerationResult, ModelInfo

logger = logging.getLogger(__name__)

DEFAULT_CLIENT_ID = os.getenv("STABILITY_CLIENT_ID", "ai-techhub-image-studio")
DEFAULT_CLIENT_VERSION = os.getenv("STABILITY_CLIENT_VERSION", "1.0.0")

_ASPECT_RATIO_MAP = {
    "1:1": "1:1",
    "16:9": "16:9",
    "9:16": "9:16",
    "4:3": "3:2",
    "21:9": "21:9",
}
DEFAULT_OUTPUT_FORMAT = "webp"
CREDITS_PER_GENERATION = 3


class ImageGenerationError(Exception):
    def __init__(self, message: str, status: int = 0) -> None:
        super().__init__(message)
        self.status = status


class StabilityAIProvider(AIProvider):
    """Generate images with Stability AI's Stable Image Core service."""

    name = "stability"

    def __init__(
        self,
        api_key: str | None = None,
        endpoint: str | None = None,
        timeout: int = 180,
        client_id: str | None = None,
        client_version: str | None = None,
    ) -> None:
        self.api_key = (api_key or os.getenv("STABILITY_API_KEY", "") or "")
        self.endpoint = endpoint or os.getenv(
            "STABILITY_IMAGE_ENDPOINT",
            "https://api.stability.ai/v2beta/stable-image/generate/core",
        )
        self.timeout = timeout
        self.client_id = client_id or DEFAULT_CLIENT_ID
        self.client_version = client_version or DEFAULT_CLIENT_VERSION

    # ------------------------------------------------------------------
    # Availability / catalog
    # ------------------------------------------------------------------
    def is_available(self) -> bool:
        """Return True when an API key is configured."""
        return bool(self.api_key.strip())

    def list_models(self) -> list[ModelInfo]:
        """Known Stable Image models (backend catalog)."""
        return [
            ModelInfo(
                name="stable-image-core",
                provider=self.name,
                family="text-to-image",
                capabilities=["image"],
            ),
            ModelInfo(
                name="stable-image-3.0",
                provider=self.name,
                family="text-to-image",
                capabilities=["image"],
            ),
            ModelInfo(
                name="stable-image-3.5",
                provider=self.name,
                family="text-to-image",
                capabilities=["image"],
            ),
        ]

    # ------------------------------------------------------------------
    # Image generation
    # ------------------------------------------------------------------
    def generate_image(
        self,
        prompt: str,
        model: str | None = None,
        **kwargs: Any,
    ) -> GenerationResult:
        """Generate an image and persist it to local storage.

        ``result.text`` holds the relative URL used for serving (``/api/...``).
        """
        user_id = kwargs.get("user_id")
        aspect_ratio = (
            kwargs.get("aspect_ratio") or kwargs.get("aspectRatio") or "1:1"
        )
        seed = kwargs.get("seed")
        negative_prompt = (
            kwargs.get("negative_prompt") or kwargs.get("negativePrompt") or ""
        )
        style_preset = kwargs.get("style_preset") or kwargs.get("style")
        output_format = kwargs.get("output_format", DEFAULT_OUTPUT_FORMAT)

        model = (model or "stable-image-core").strip()
        requested_width, requested_height = self._get_dimensions(aspect_ratio)

        payload: dict[str, Any] = {
            "prompt": prompt,
            "aspect_ratio": _ASPECT_RATIO_MAP.get(aspect_ratio, aspect_ratio),
            "output_format": output_format,
        }
        if seed:
            try:
                payload["seed"] = int(seed)
            except (TypeError, ValueError):
                pass
        if negative_prompt:
            payload["negative_prompt"] = negative_prompt
        if style_preset:
            payload["style_preset"] = style_preset

        headers: dict[str, str] = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "image/*",
            "Stability-Client-Id": self.client_id,
            "Stability-Client-Version": self.client_version,
        }

        logger.info(
            "Stability AI generation request: endpoint=%s model=%s prompt_len=%d",
            self.endpoint,
            model,
            len(prompt),
        )

        try:
            resp = requests.post(
                self.endpoint,
                headers=headers,
                files={"none": ""},
                data=payload,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            logger.warning("Stability AI network error: %s", exc)
            raise self._to_image_error(exc)

        if resp.status_code == 200 and resp.content:
            ext = "webp" if output_format == "webp" else "png"
            filename = f"{uuid.uuid4().hex}.{ext}"
            path = save_image_bytes(
                user_id=user_id, data=resp.content, filename=filename, extension=ext
            )
            logger.info("Stability AI image saved: %s (%d bytes)", path, len(resp.content))
            return GenerationResult(
                text=f"/api/image-studio/images/{filename}",
                model=model,
                tokens_used=CREDITS_PER_GENERATION,
                metadata={
                    "provider": self.name,
                    "aspect_ratio": aspect_ratio,
                    "style_preset": style_preset,
                    "output_format": output_format,
                    "credits_consumed": CREDITS_PER_GENERATION,
                    "seed": int(seed) if seed else None,
                    "width": requested_width,
                    "height": requested_height,
                    "status": "completed",
                },
            )

        error_payload = {}
        try:
            error_payload = resp.json()
        except Exception:
            pass
        message = (
            error_payload.get("error", {}).get("message")
            or resp.text
            or f"Stability API returned {resp.status_code}"
        )
        logger.warning("Stability AI error %s: %s", resp.status_code, message)
        raise ImageGenerationError(message, status=resp.status_code)

    # ------------------------------------------------------------------
    # Other abstract methods (image-only provider)
    # ------------------------------------------------------------------
    def chat(self, messages, model=None, **kwargs) -> GenerationResult:
        return GenerationResult(
            text=(
                "Stability AI is an image-generation provider; use the Image "
                "Studio for image generation."
            ),
            model=f"{model or 'stable-image-core'} (image-only)",
            tokens_used=0,
            metadata={"status": "not-applicable"},
        )

    def chat_stream(self, messages, model=None, **kwargs):
        return iter(("",))

    def generate(self, prompt, model=None, **kwargs) -> GenerationResult:
        return GenerationResult(
            text=(
                "Stability AI is an image-generation provider; use the Image "
                "Studio for image generation."
            ),
            model=f"{model or 'stable-image-core'} (image-only)",
            tokens_used=0,
            metadata={"status": "not-applicable"},
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _get_dimensions(aspect_ratio: str) -> tuple[int, int]:
        """Placeholder dims; Stability AI picks the real resolution itself."""
        return 1024, 1024

    @staticmethod
    def _to_image_error(exc: Exception) -> Exception:
        """Wrap a network-level exception in a stable application error."""
        from app.services.image_service import ImageError

        return ImageError(f"Could not reach Stability AI image service: {exc}")
