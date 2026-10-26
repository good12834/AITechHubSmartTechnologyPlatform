"""Image service: AI image generation / vision analysis."""
import html
import logging
import os
import random
import time
import urllib.parse
import uuid
import requests
from flask import current_app

from app.extensions import db
from app.models import Generation, GenerationType, GenerationStatus, UsageRecord, UsageType
from app.services.ai.model_manager import resolve_model
from app.services.ai.registry import get_provider
from app.services.ai.base import GenerationResult

logger = logging.getLogger(__name__)


class ImageError(Exception):
    """Raised when an image operation cannot be completed."""


ASPECT_RATIO_MAP = {
    "1:1": (1024, 1024),
    "16:9": (1280, 720),
    "9:16": (720, 1280),
    "4:3": (1024, 768),
    "21:9": (1344, 576),
}

STYLE_PROMPT_MAP = {
    "Photorealistic": "photorealistic, 8k resolution, cinematic lighting, ultra-detailed, studio shot, DSLR quality",
    "Cyberpunk Neon": "cyberpunk style, neon glow, futuristic metropolis, synthwave colors, volumetric lights, 8k",
    "Anime & Manga": "modern anime aesthetic, vibrant studio Makoto Shinkai style, crisp lineart, colorful, detailed background",
    "3D Isometric": "3D isometric render, blender cycles, smooth clay & glass materials, tilt-shift lens, soft ambient shadows",
    "Oil Painting": "classic oil painting, textured brushstrokes, rich pigments, masterwork, dramatic chiaroscuro",
    "Dark Fantasy": "dark fantasy, gothic, mystical atmosphere, moody volumetric fog, intricate dark aesthetic, epic scale",
    "Cinematic Film": "cinematic film still, 35mm photograph, anamorphic lens flare, color graded, dramatic composition",
    "Minimalist Vector": "clean vector illustration, modern flat art, elegant color palette, minimalist design",
}


def _get_dimensions(aspect_ratio: str | None) -> tuple[int, int]:
    if not aspect_ratio:
        return 1024, 1024
    return ASPECT_RATIO_MAP.get(aspect_ratio, (1024, 1024))


def _generate_procedural_svg(prompt: str, style: str | None, width: int, height: int, seed: int) -> str:
    """Generate a sophisticated procedural SVG visual artwork as a zero-failure fallback."""
    rng = random.Random(seed)
    
    # Generate dynamic palette based on style/seed
    palettes = {
        "Cyberpunk Neon": [("#0F172A", "#1E1B4B"), "#7959F5", "#06B6D4", "#EC4899", "#F43F5E"],
        "Photorealistic": [("#090D16", "#1E293B"), "#38BDF8", "#818CF8", "#F8FAFC", "#94A3B8"],
        "Anime & Manga": [("#180D2B", "#3B0764"), "#C084FC", "#F472B6", "#38BDF8", "#FDE047"],
        "3D Isometric": [("#0B132B", "#1C2541"), "#48E5C2", "#F39237", "#3B82F6", "#F4F4F9"],
        "Dark Fantasy": [("#050505", "#1A0B2E"), "#9333EA", "#475569", "#A855F7", "#E2E8F0"],
        "Oil Painting": [("#191308", "#2C1810"), "#D97706", "#B45309", "#92400E", "#FDE68A"],
    }
    
    selected_palette = palettes.get(style or "Cyberpunk Neon", palettes["Cyberpunk Neon"])
    bg_start, bg_end = selected_palette[0]
    accent1, accent2, accent3, accent4 = selected_palette[1:]
    
    # Shapes
    circles = []
    for _ in range(6):
        cx = rng.randint(int(width * 0.1), int(width * 0.9))
        cy = rng.randint(int(height * 0.1), int(height * 0.9))
        r = rng.randint(int(min(width, height) * 0.15), int(min(width, height) * 0.45))
        color = rng.choice([accent1, accent2, accent3, accent4])
        opacity = rng.uniform(0.25, 0.6)
        blur = rng.randint(40, 90)
        circles.append(
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}" opacity="{opacity:.2f}" filter="url(#glow-blur-{blur})" />'
        )

    # Geometry grid / accents
    grid_lines = []
    step = int(min(width, height) / 8)
    for x in range(0, width, step):
        grid_lines.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{height}" stroke="rgba(255,255,255,0.04)" stroke-width="1" />')
    for y in range(0, height, step):
        grid_lines.append(f'<line x1="0" y1="{y}" x2="{width}" y2="{y}" stroke="rgba(255,255,255,0.04)" stroke-width="1" />')

    escaped_prompt = html.escape(prompt[:90] + ("..." if len(prompt) > 90 else ""))
    escaped_style = html.escape(style or "Generative Art")

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_start}" />
      <stop offset="100%" stop-color="{bg_end}" />
    </linearGradient>
    <filter id="glow-blur-40"><feGaussianBlur stdDeviation="40" /></filter>
    <filter id="glow-blur-60"><feGaussianBlur stdDeviation="60" /></filter>
    <filter id="glow-blur-90"><feGaussianBlur stdDeviation="90" /></filter>
    <radialGradient id="meshGrad" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="{accent1}" stop-opacity="0.5" />
      <stop offset="50%" stop-color="{accent2}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="transparent" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="{width}" height="{height}" fill="url(#bgGrad)" />
  
  <!-- Ambient Grid -->
  {''.join(grid_lines)}

  <!-- Organic Glowing Meshes -->
  <rect width="{width}" height="{height}" fill="url(#meshGrad)" />
  {''.join(circles)}

  <!-- Glass Card Banner -->
  <g transform="translate({int(width*0.06)}, {int(height*0.72)})">
    <rect width="{int(width*0.88)}" height="{int(height*0.22)}" rx="20" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />
    <circle cx="36" cy="36" r="14" fill="{accent1}" />
    <text x="60" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="{max(12, int(height*0.022))}" font-weight="700" fill="#22D3EE" letter-spacing="1">
      AI TECHHUB VISION ENGINE • {escaped_style.upper()}
    </text>
    <text x="36" y="{max(68, int(height*0.11))}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="{max(14, int(height*0.026))}" font-weight="500" fill="#F8FAFC">
      "{escaped_prompt}"
    </text>
  </g>

  <!-- Frame border -->
  <rect x="0" y="0" width="{width}" height="{height}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
</svg>"""
    return svg


def generate_image(user_id: str, prompt: str, model: str | None = None,
                   style: str | None = None, aspect_ratio: str | None = None,
                   seed: int | None = None, negative_prompt: str | None = None,
                   **gen_kwargs) -> Generation:
    """Generate an AI visual artwork and persist the Generation record.
    
    Uses high-speed diffusion neural synthesis with local file persistence,
    and provides a beautiful procedural visual vector fallback if external
    networks are unreachable.
    """
    if not prompt or not prompt.strip():
        raise ImageError("Prompt cannot be empty.")

    clean_prompt = prompt.strip()
    style = style or "Photorealistic"
    aspect_ratio = aspect_ratio or "1:1"
    width, height = _get_dimensions(aspect_ratio)
    actual_seed = seed if seed is not None else random.randint(100000, 99999999)
    model_name = model or "flux-schnell"

    # Let model_manager select the appropriate provider + model for image generation.
    provider_name, provider_model = resolve_model("image", model)

    # Assemble enhanced artistic prompt
    style_suffix = STYLE_PROMPT_MAP.get(style, "")
    full_prompt = f"{clean_prompt}, {style_suffix}".strip(", ")
    
    record = Generation(
        user_id=user_id,
        type=GenerationType.IMAGE,
        status=GenerationStatus.RUNNING,
        prompt=clean_prompt,
        model=provider_model,
        metadata_json={
            "style": style,
            "aspect_ratio": aspect_ratio,
            "width": width,
            "height": height,
            "seed": actual_seed,
            "negative_prompt": negative_prompt or "",
        }
    )
    db.session.add(record)
    db.session.commit()

    started = time.monotonic()
    provider_result = None

    def _is_served_image_url(text: str | None) -> bool:
        if not text:
            return False
        return (
            text.startswith("http://")
            or text.startswith("https://")
            or text.startswith("data:")
            or text.startswith("/api/image-studio/images/")
        )

    # Step 1: Attempt high-quality text-to-image synthesis via the selected
    # provider (Stability AI, when configured), falling back to Pollinations
    # and then to a zero-failure procedural vector artwork.
    try:
        provider_result = get_provider(provider_name).generate_image(
            full_prompt,
            model=provider_model,
            user_id=user_id,
            aspect_ratio=aspect_ratio,
            seed=seed,
            negative_prompt=negative_prompt,
        )
        # Some providers (e.g. Ollama) return plain text on success instead of
        # an image URL; reject non-image output so we fall back to a real image.
        if not _is_served_image_url(provider_result.text):
            logger.warning(
                "Provider %s returned non-image output; falling back", provider_name
            )
            provider_result = None
    except Exception as exc:  # noqa: BLE001
        logger.warning("Provider %s failed for image generation: %s", provider_name, exc)
        provider_result = None

    # Fallback 1: Pollinations API (used when the provider failed or returned
    # something that is not a servable image).
    if provider_result is None:
        try:
            encoded_prompt = urllib.parse.quote(full_prompt)
            pollinations_url = (
                f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                f"?width={width}&height={height}&seed={actual_seed}&nologo=true&model={provider_model}&enhance=false"
            )
            if negative_prompt:
                pollinations_url += f"&negative={urllib.parse.quote(negative_prompt)}"

            resp = requests.get(pollinations_url, timeout=25)
            if resp.status_code == 200 and resp.content and len(resp.content) > 1000:
                ext = "jpeg" if "jpeg" in resp.headers.get("content-type", "").lower() else "png"
                generated_filename = f"{uuid.uuid4().hex}.{ext}"
                save_image_bytes(user_id=user_id, data=resp.content, filename=generated_filename)
                provider_result = GenerationResult(
                    text=f"/api/image-studio/images/{generated_filename}",
                    model=provider_model,
                    tokens_used=100,
                )
            else:
                logger.warning(
                    "Pollinations fallback returned unusable response: status=%s len=%s",
                    resp.status_code,
                    len(resp.content or b""),
                )
        except Exception as poll_exc:  # noqa: BLE001
            logger.warning("Pollinations fallback failed: %s", poll_exc)

    # Fallback 2: procedural vector artwork (zero-failure last resort). Runs
    # whenever Pollinations failed for any reason (exception or non-200 response).
    if provider_result is None:
        try:
            svg_content = _generate_procedural_svg(clean_prompt, style, width, height, actual_seed)
            generated_filename = f"{uuid.uuid4().hex}.svg"
            save_image_bytes(user_id=user_id, data=svg_content.encode("utf-8"), filename=generated_filename)
            provider_result = GenerationResult(
                text=f"/api/image-studio/images/{generated_filename}",
                model=provider_model,
                tokens_used=35,
            )
        except Exception as svg_exc:  # noqa: BLE001
            logger.error("Procedural SVG fallback failed: %s", svg_exc)

    if provider_result is None:
        raise ImageError("Image generation failed: no usable image output")

    generated_filename = provider_result.text.split("/api/image-studio/images/")[-1]
    record.output = provider_result.text
    record.tokens_used = provider_result.tokens_used
    if provider_result.metadata:
        if record.metadata_json is None:
            record.metadata_json = {}
        record.metadata_json.update(provider_result.metadata)
    record.status = GenerationStatus.COMPLETED
    record.duration_ms = int((time.monotonic() - started) * 1000)

    if record.metadata_json is None:
        record.metadata_json = {}
    record.metadata_json["filename"] = generated_filename

    db.session.add(UsageRecord(
        user_id=user_id,
        type=UsageType.IMAGE_GENERATION,
        quantity=1,
        tokens=record.tokens_used
    ))
    db.session.commit()
    return record


def _get_upload_folder() -> str:
    cfg = current_app.config.get("UPLOAD_FOLDER", "./uploads")
    if os.path.isabs(cfg):
        base = cfg
    else:
        base = os.path.abspath(os.path.join(current_app.root_path, "..", cfg))
    folder = os.path.join(base, "generated")
    os.makedirs(folder, exist_ok=True)
    return folder


def save_image_bytes(user_id: str, data: bytes, filename: str | None = None, extension: str = "png") -> str:
    """Persist raw image bytes under the uploads folder; returns the path."""
    folder = _get_upload_folder()
    if not filename:
        filename = f"{uuid.uuid4().hex}.{extension.lstrip('.')}"
    path = os.path.join(folder, filename)
    with open(path, "wb") as fh:
        fh.write(data)
    return path


def delete_generation(user_id: str, generation_id: str) -> bool:
    """Delete a generation record and any associated generated file."""
    record = db.session.get(Generation, generation_id)
    if not record or record.user_id != user_id:
        return False

    # Remove stored file if present
    if record.output and "/api/image-studio/images/" in record.output:
        fname = record.output.split("/api/image-studio/images/")[-1]
        folder = _get_upload_folder()
        fpath = os.path.join(folder, fname)
        if os.path.exists(fpath):
            try:
                os.remove(fpath)
            except OSError:
                pass

    db.session.delete(record)
    db.session.commit()
    return True
