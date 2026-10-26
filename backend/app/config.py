"""Application configuration loaded from environment variables."""
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class BaseConfig:
    """Shared configuration for all environments."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 1800}

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "3600")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", "2592000")))
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_TYPE = "Bearer"

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")
        if origin.strip()
    ]

    # Flask-Limiter
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URL", "redis://localhost:6379/1")
    RATELIMIT_DEFAULT = "200 per hour"
    RATELIMIT_HEADERS_ENABLED = True

    # Celery / Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/2")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/3")
    CELERY_TASK_SERIALIZER = "json"
    CELERY_RESULT_SERIALIZER = "json"
    CELERY_ACCEPT_CONTENT = ["json"]
    CELERY_TIMEZONE = "UTC"
    CELERY_ENABLE_UTC = True

    # Ollama AI provider (local fallback / image synthesis)
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_DEFAULT_CHAT_MODEL = os.getenv("OLLAMA_DEFAULT_CHAT_MODEL", "llama3.1")
    OLLAMA_DEFAULT_CODE_MODEL = os.getenv("OLLAMA_DEFAULT_CODE_MODEL", "qwen2.5-coder")
    OLLAMA_DEFAULT_IMAGE_MODEL = os.getenv("OLLAMA_DEFAULT_IMAGE_MODEL", "llava")
    AI_REQUEST_TIMEOUT = int(os.getenv("AI_REQUEST_TIMEOUT", "120"))

    # Gemini AI provider (cloud)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL") or os.getenv("AI_MODEL", "gemini-2.5-flash")
    GEMINI_TIMEOUT_MS = int(os.getenv("GEMINI_TIMEOUT_MS", "30000"))
    # Failover chain used when the primary model is rate-limited (free-tier quota
    # is metered PER MODEL, so switching models keeps real AI answers flowing).
    GEMINI_FALLBACK_MODELS = [
        m.strip()
        for m in os.getenv("GEMINI_FALLBACK_MODELS", "gemini-flash-lite-latest,gemini-2.5-flash").split(",")
        if m.strip()
    ]
    # Identical prompts are cached for this long (ms) to save quota.
    GEMINI_CACHE_TTL_MS = int(os.getenv("GEMINI_CACHE_TTL_MS", "300000"))
    # Cross-provider default model override.
    AI_MODEL = os.getenv("AI_MODEL", "")


    # Stability AI provider (text-to-image via Stable Image Core)
    STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "")
    STABILITY_IMAGE_ENDPOINT = os.getenv(
        "STABILITY_IMAGE_ENDPOINT",
        "https://api.stability.ai/v2beta/stable-image/generate/core",
    )

    # Active provider: "gemini" when an API key is configured, else local "ollama".
    DEFAULT_AI_PROVIDER = os.getenv("DEFAULT_AI_PROVIDER") or ("gemini" if GEMINI_API_KEY else "ollama")


    # Uploads
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "./uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(25 * 1024 * 1024)))
    ALLOWED_EXTENSIONS = {
        ext.strip().lower()
        for ext in os.getenv("ALLOWED_EXTENSIONS", "txt,md,pdf,docx,png,jpg,jpeg,gif,webp").split(",")
        if ext.strip()
    }

    # Usage limits (per plan)
    PLAN_LIMITS = {
        "free": {"messages_per_day": 50, "images_per_day": 5, "storage_mb": 100},
        "pro": {"messages_per_day": 1000, "images_per_day": 100, "storage_mb": 5120},
        "admin": {"messages_per_day": 100000, "images_per_day": 10000, "storage_mb": 51200},
    }


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "sqlite:///dev.db"
    )


class TestingConfig(BaseConfig):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=60)
    WTF_CSRF_ENABLED = False
    RATELIMIT_STORAGE_URI = "memory://"
    CELERY_TASK_ALWAYS_EAGER = True


class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "pool_size": 10,
        "max_overflow": 20,
    }


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config(name: str | None = None) -> type[BaseConfig]:
    name = (name or os.getenv("FLASK_ENV", "development")).lower()
    return config_by_name.get(name, DevelopmentConfig)
