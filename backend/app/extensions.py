"""Shared Flask extension instances.

Instantiate extensions here (without an app) and initialize them inside
the app factory in ``app/__init__.py``.
"""
from celery import Celery
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
celery = Celery("ai_tech_hub", broker="redis://localhost:6379/2")
