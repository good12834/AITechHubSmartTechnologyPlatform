"""Flask application entry point for local development."""
import os

from dotenv import load_dotenv

load_dotenv()

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402

app = create_app(os.getenv("FLASK_ENV", "development"))


@app.cli.command("init-db")
def init_db():
    """Flask CLI command: flask init-db (create all tables)."""
    db.create_all()
    print("Database tables created.")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=app.config.get("DEBUG", False))
