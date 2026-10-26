"""Seed initial demo and admin accounts."""
import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.extensions import db
from app.models import User, UserRole, UserPlan, Project, Conversation

app = create_app(os.getenv("FLASK_ENV", "development"))

with app.app_context():
    db.create_all()

    # Create admin user if not exists
    admin = User.query.filter_by(email="admin@aitechhub.local").first()
    if not admin:
        admin = User(
            email="admin@aitechhub.local",
            username="admin",
            role=UserRole.ADMIN,
            plan=UserPlan.ADMIN,
        )
        admin.set_password("AdminPass123!")
        db.session.add(admin)
        print("Created admin user: admin@aitechhub.local / AdminPass123!")

    # Create demo user if not exists
    demo = User.query.filter_by(email="demo@aitechhub.local").first()
    if not demo:
        demo = User(
            email="demo@aitechhub.local",
            username="demo_user",
            role=UserRole.USER,
            plan=UserPlan.PRO,
        )
        demo.set_password("DemoPass123!")
        db.session.add(demo)
        print("Created demo user: demo@aitechhub.local / DemoPass123!")

    db.session.commit()

    # Seed sample project and conversation for demo user
    if demo and Project.query.filter_by(owner_id=demo.id).count() == 0:
        proj = Project(
            owner_id=demo.id,
            name="AI TechHub Core Architecture",
            description="Full-stack AI workspace with local Ollama runtime and MySQL persistence.",
        )
        db.session.add(proj)
        db.session.commit()

        conv = Conversation(
            user_id=demo.id,
            project_id=proj.id,
            title="Getting Started with Local Inference",
            model="gemma4:e4b",
        )
        db.session.add(conv)
        db.session.commit()
        print("Seeded starter project and conversation for demo user.")

    print("Database seeding completed.")
