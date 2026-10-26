"""Usage service: metering and plan-limit enforcement."""
from datetime import date, timedelta

from flask import current_app
from sqlalchemy import func

from app.extensions import db
from app.models import UsageRecord, UsageType, User


class UsageLimitExceeded(Exception):
    """Raised when a user has exceeded their plan's allowance."""

    def __init__(self, message: str, limit: int, current: int):
        super().__init__(message)
        self.limit = limit
        self.current = current


def record_usage(user_id: str, usage_type: UsageType, quantity: int = 1, tokens: int = 0,
                 metadata: dict | None = None) -> UsageRecord:
    record = UsageRecord(
        user_id=user_id,
        type=usage_type,
        quantity=quantity,
        tokens=tokens,
        metadata_json=metadata,
    )
    db.session.add(record)
    db.session.commit()
    return record


def usage_today(user_id: str, usage_type: UsageType | None = None) -> int:
    """Sum of ``quantity`` for a user today (optionally for one type)."""
    query = db.session.query(func.coalesce(func.sum(UsageRecord.quantity), 0)).filter(
        UsageRecord.user_id == user_id,
        UsageRecord.recorded_on == date.today(),
    )
    if usage_type is not None:
        query = query.filter(UsageRecord.type == usage_type)
    return int(query.scalar())


def _plan_limit(user: User, key: str) -> int:
    limits = current_app.config.get("PLAN_LIMITS", {})
    plan = user.plan.value if user.plan else "free"
    return limits.get(plan, limits.get("free", {})).get(key, 0)


def check_limit(user: User, usage_type: UsageType) -> None:
    """Raise UsageLimitExceeded if the user is over their plan's daily limit."""
    limit_map = {
        UsageType.CHAT_MESSAGE: ("messages_per_day", None),
        UsageType.CODE_GENERATION: ("messages_per_day", None),
        UsageType.IMAGE_GENERATION: ("images_per_day", None),
    }
    if usage_type not in limit_map:
        return  # No daily cap for this type.

    limit_key, _ = limit_map[usage_type]
    limit = _plan_limit(user, limit_key)
    if limit <= 0:
        return  # Unlimited.

    current = usage_today(user.id, usage_type)
    if current >= limit:
        raise UsageLimitExceeded(
            f"Daily limit of {limit} reached for {usage_type.value}. Upgrade your plan to continue.",
            limit=limit,
            current=current,
        )


def usage_summary(user_id: str, days: int = 30) -> dict:
    """Aggregate usage for the last N days, grouped by type and day."""
    since = date.today() - timedelta(days=days - 1)
    rows = (
        db.session.query(
            UsageRecord.recorded_on,
            UsageRecord.type,
            func.sum(UsageRecord.quantity),
            func.sum(UsageRecord.tokens),
        )
        .filter(UsageRecord.user_id == user_id, UsageRecord.recorded_on >= since)
        .group_by(UsageRecord.recorded_on, UsageRecord.type)
        .all()
    )
    by_day: dict[str, dict] = {}
    for recorded_on, u_type, quantity, tokens in rows:
        key = recorded_on.isoformat() if hasattr(recorded_on, "isoformat") else str(recorded_on)
        entry = by_day.setdefault(key, {"total_quantity": 0, "total_tokens": 0, "by_type": {}})
        entry["total_quantity"] += int(quantity or 0)
        entry["total_tokens"] += int(tokens or 0)
        entry["by_type"][u_type.value if hasattr(u_type, "value") else str(u_type)] = int(quantity or 0)

    return {"user_id": user_id, "days": days, "summary": by_day}
