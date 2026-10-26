"""Usage blueprint: current limits and historical usage for the caller."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.security.permissions import current_user
from app.services import usage_service
from app.utils import success_response

usage_bp = Blueprint("usage", __name__)


@usage_bp.get("/summary")
@jwt_required()
def summary():
    """Aggregate usage over the last N days (default 30)."""
    user = current_user()
    days = request.args.get("days", 30, type=int)
    days = max(1, min(days, 365))
    return success_response(usage_service.usage_summary(user.id, days=days))


@usage_bp.get("/limits")
@jwt_required()
def limits():
    """Return the caller's plan limits and current usage against them."""
    from flask import current_app

    user = current_user()
    plan = user.plan.value if user.plan else "free"
    limits = current_app.config.get("PLAN_LIMITS", {}).get(plan, {})

    usage = {
        "chat_messages_today": usage_service.usage_today(user.id),
        "images_today": usage_service.usage_today(user.id, usage_service.UsageType.IMAGE_GENERATION),
    }
    return success_response({"plan": plan, "limits": limits, "usage_today": usage})
