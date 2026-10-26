"""Flask application factory."""
from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from app.config import get_config
from app.extensions import celery, cors, db, jwt, limiter, migrate


def create_app(config_name: str | None = None) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    _register_extensions(app)
    _register_blueprints(app)
    _register_error_handlers(app)
    _register_shell_context(app)

    return app


def _register_extensions(app: Flask) -> None:
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})
    limiter.init_app(app)

    # Configure Celery with the app's settings.
    celery.conf.update(
        broker_url=app.config.get("CELERY_BROKER_URL"),
        result_backend=app.config.get("CELERY_RESULT_BACKEND"),
        task_serializer=app.config.get("CELERY_TASK_SERIALIZER", "json"),
        result_serializer=app.config.get("CELERY_RESULT_SERIALIZER", "json"),
        accept_content=app.config.get("CELERY_ACCEPT_CONTENT", ["json"]),
        timezone=app.config.get("CELERY_TIMEZONE", "UTC"),
        enable_utc=app.config.get("CELERY_ENABLE_UTC", True),
        task_track_started=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
    )

    # Attach the Flask app to the Celery instance for context handling.
    class ContextTask(celery.Task):
        abstract = True

        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    app.extensions["celery"] = celery


def _register_blueprints(app: Flask) -> None:
    """Register all API blueprints under the /api prefix."""
    from app.api.auth import auth_bp
    from app.api.users import users_bp
    from app.api.chat import chat_bp
    from app.api.code_studio import code_bp
    from app.api.documents import documents_bp
    from app.api.image_studio import image_bp
    from app.api.projects import projects_bp
    from app.api.workflows import workflows_bp
    from app.api.usage import usage_bp
    from app.api.admin import admin_bp
    from app.api.mcp import mcp_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(code_bp, url_prefix="/api/code-studio")
    app.register_blueprint(documents_bp, url_prefix="/api/documents")
    app.register_blueprint(image_bp, url_prefix="/api/image-studio")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(workflows_bp, url_prefix="/api/workflows")
    app.register_blueprint(usage_bp, url_prefix="/api/usage")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(mcp_bp, url_prefix="/api/mcp")

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200


def _register_error_handlers(app: Flask) -> None:
    """Return JSON error responses for HTTP exceptions and generic errors."""

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc):
        response = jsonify({"error": exc.description, "code": exc.name})
        response.status_code = exc.code
        return response

    @app.errorhandler(Exception)
    def handle_generic_exception(exc):
        app.logger.exception("Unhandled exception: %s", exc)
        return jsonify({"error": "Internal server error", "code": "Internal Server Error"}), 500


def _register_shell_context(app: Flask) -> None:
    @app.shell_context_processor
    def make_shell_context():
        return {"db": db}
