"""MCP Blueprint: tool endpoints for the AI agent."""

from flask import Blueprint, request
from app.models.project import Project
from app.models.document import Document
from app.models.generation import Generation
from app.utils import error_response, success_response

mcp_bp = Blueprint("mcp", __name__)

TOOL_DEFINITIONS = [
    {"name": "search_projects", "description": "Search projects by name", "parameters": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer", "default": 10}}, "required": ["query"]}},
    {"name": "get_project_details", "description": "Get project by UUID", "parameters": {"type": "object", "properties": {"project_id": {"type": "string"}}, "required": ["project_id"]}},
    {"name": "search_documents", "description": "Search documents by filename", "parameters": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer", "default": 10}}, "required": ["query"]}},
    {"name": "enhance_prompt", "description": "Enhance a basic image prompt into a vivid detailed prompt", "parameters": {"type": "object", "properties": {"prompt": {"type": "string"}, "style": {"type": "string"}}, "required": ["prompt"]}},
    {"name": "list_generated_images", "description": "List recent AI-generated images for a user", "parameters": {"type": "object", "properties": {"user_id": {"type": "string"}, "limit": {"type": "integer", "default": 10}}, "required": ["user_id"]}},
    {"name": "get_image_styles", "description": "Return supported artistic styles", "parameters": {"type": "object", "properties": {}}},
]


@mcp_bp.get("/tools")
def list_tools():
    return success_response({"tools": TOOL_DEFINITIONS})


@mcp_bp.post("/call")
def call_tool():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    args = payload.get("arguments", {})
    if not name:
        return error_response("Tool name is required.", status=400)
    try:
        result = _dispatch(name, args)
        return success_response({"result": result})
    except ValueError as exc:
        return error_response(str(exc), status=404)
    except Exception as exc:
        return error_response(str(exc), status=400)


def _dispatch(name, args):
    m = {
        "search_projects": _search_projects,
        "get_project_details": _get_project_details,
        "search_documents": _search_documents,
        "enhance_prompt": _enhance_prompt,
        "list_generated_images": _list_generated_images,
        "get_image_styles": lambda a: _get_image_styles(),
    }
    if name not in m:
        raise ValueError(f"Unknown tool: {name}")
    return m[name](args)


def _search_projects(args):
    q = args.get("query", "")
    limit = min(int(args.get("limit", 10)), 50)
    return [p.to_dict() for p in Project.query.filter(Project.name.ilike(f"%{q}%")).limit(limit).all()]


def _get_project_details(args):
    pid = args.get("project_id")
    if not pid:
        raise ValueError("project_id required")
    p = Project.query.get(pid)
    if not p:
        raise ValueError("Project not found")
    return p.to_dict()


def _search_documents(args):
    q = args.get("query", "")
    limit = min(int(args.get("limit", 10)), 50)
    return [d.to_dict() for d in Document.query.filter(Document.filename.ilike(f"%{q}%")).limit(limit).all()]


def _enhance_prompt(args):
    prompt = args.get("prompt", "").strip()
    style = args.get("style", "Photorealistic")
    if not prompt:
        raise ValueError("prompt required")
    try:
        from app.services.ai.model_manager import resolve_model
        from app.services.ai.registry import get_provider
        from app.services.ai.base import ChatMessage
        pname, mname = resolve_model("chat", None)
        provider = get_provider(pname)
        instruction = (
            "You are an AI image prompt engineer. "
            "Expand the idea into a vivid detailed text-to-image prompt. "
            f"Style: {style}. Return ONLY the prompt."
        )
        sys_msg = ChatMessage(role="system", content=instruction)
        usr_msg = ChatMessage(role="user", content=f"Enhance: {prompt}")
        reply = provider.chat([sys_msg, usr_msg], model=mname)
        enhanced = reply.content.strip() if hasattr(reply, "content") else str(reply).strip()
        return {"original": prompt, "enhanced": enhanced, "style": style}
    except Exception as exc:
        suffixes = {
            "Photorealistic": "photorealistic, 8k, ultra-detailed, cinematic lighting",
            "Cyberpunk Neon": "cyberpunk neon city, synthwave colors, volumetric rain, 8k",
        }
        suffix = suffixes.get(style, "highly detailed, professional quality")
        return {"original": prompt, "enhanced": f"{prompt}, {suffix}", "style": style, "note": str(exc)}


def _list_generated_images(args):
    uid = args.get("user_id")
    limit = min(int(args.get("limit", 10)), 50)
    if not uid:
        raise ValueError("user_id required")
    rows = Generation.query.filter_by(user_id=uid).order_by(Generation.created_at.desc()).limit(limit).all()
    return [g.to_dict() for g in rows]


def _get_image_styles():
    return [
        {"id": "Photorealistic", "icon": "camera", "desc": "Ultra-detailed 8K DSLR photo"},
        {"id": "Cyberpunk Neon", "icon": "city", "desc": "Futuristic synthwave glow"},
        {"id": "Anime and Manga", "icon": "sparkles", "desc": "Vibrant Makoto Shinkai style"},
        {"id": "3D Isometric", "icon": "cube", "desc": "Smooth clay and glass render"},
        {"id": "Oil Painting", "icon": "palette", "desc": "Rich classic canvas brushwork"},
        {"id": "Dark Fantasy", "icon": "crystal", "desc": "Moody gothic atmospheric"},
        {"id": "Cinematic Film", "icon": "film", "desc": "35mm anamorphic movie still"},
        {"id": "Minimalist Vector", "icon": "vector", "desc": "Clean geometric vector flat art"},
        {"id": "Watercolor", "icon": "brush", "desc": "Soft flowing watercolor washes"},
        {"id": "Pixel Art", "icon": "pixel", "desc": "Retro pixel art game aesthetic"},
        {"id": "Steampunk", "icon": "gear", "desc": "Victorian clockwork machinery"},
        {"id": "Surrealist", "icon": "spiral", "desc": "Dreamlike Salvador Dali vision"},
    ]
