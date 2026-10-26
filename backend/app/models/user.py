"""User model and related enums."""
import enum
from datetime import datetime, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.extensions import db
from app.models.base import TimestampMixin, generate_uuid

ph = PasswordHasher()


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class UserPlan(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ADMIN = "admin"


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.USER, nullable=False)
    plan = db.Column(db.Enum(UserPlan), default=UserPlan.FREE, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    conversations = db.relationship("Conversation", back_populates="user", lazy="dynamic", cascade="all, delete-orphan")
    projects = db.relationship("Project", back_populates="owner", lazy="dynamic", cascade="all, delete-orphan")
    documents = db.relationship("Document", back_populates="user", lazy="dynamic", cascade="all, delete-orphan")
    usage_records = db.relationship("UsageRecord", back_populates="user", lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, raw_password: str) -> None:
        self.password_hash = ph.hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        try:
            return ph.verify(self.password_hash, raw_password)
        except VerifyMismatchError:
            return False

    def needs_rehash(self) -> bool:
        return ph.check_needs_rehash(self.password_hash)

    def touch_login(self) -> None:
        self.last_login_at = datetime.now(timezone.utc)

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "role": self.role.value if self.role else None,
            "plan": self.plan.value if self.plan else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
        }
