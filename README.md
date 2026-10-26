# AI TechHub Smart Technology Platform

A full-stack AI workspace with local/cloud inference, a code studio with live preview, document and image studios, workflows, chat, usage tracking, and role-based access control.

```
AI TechHub Smart Technology Platform
├── backend/                 # Flask REST API + Celery workers + MySQL
│   ├── app/
│   │   ├── __init__.py      # Application factory
│   │   ├── config.py        # Configuration
│   │   ├── extensions.py    # Flask extensions (db, jwt, migrate, limiter, cors, celery)
│   │   ├── api/             # Route blueprints (auth, users, projects, chat, documents,
│   │   │   │                # image_studio, code_studio, workflows, usage, mcp, admin)
│   │   ├── models/          # SQLAlchemy models (user, project, conversation, message,
│   │   │   │                # document, generation, usage, workflow)
│   │   ├── services/        # Business logic (chat, document, image, code, retrieval,
│   │   │   │                # usage) and AI providers (gemini, ollama, stability)
│   │   ├── tasks/           # Celery background tasks (document, image, cleanup)
│   │   ├── security/        # Permissions, upload validation, input validation
│   │   └── utils/
│   ├── migrations/          # Flask-Migrate database migrations
│   ├── instance/            # Local runtime files
│   ├── uploads/             # User file uploads
│   ├── venv/                # Python virtual environment
│   ├── run.py               # Flask dev server entry point
│   ├── celery_worker.py     # Celery worker entry point
│   ├── seed_demo.py         # Seeds admin/demo accounts and starter data
│   ├── Dockerfile           # Backend container image (gunicorn)
│   ├── requirements.txt     # Python dependencies
│   ├── .env / .env.example  # Environment configuration
│   ├── backend_run.log
│   ├── startup.log
│   ├── pytest.ini
│   └── tests/
├── frontend/                # React 19 + Vite SPA (Tailwind CSS)
│   ├── src/
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── services/        # API clients (authApi, chatApi, codeApi, projectsApi,
│   │   │   │                # documentsApi, imageApi, mcpApi, usageApi, workflowsApi,
│   │   │   │                # adminApi, apiClient, streamClient)
│   │   ├── features/        # Feature pages (dashboard, projects, code-studio,
│   │   │   │                # documents, image-studio, workflows, usage, settings,
│   │   │   │                # public pages)
│   │   └── layouts/         # AdminLayout, PublicLayout, WorkspaceLayout
│   ├── dist/                # Production build output
│   ├── public/
│   ├── node_modules/
│   ├── package.json
│   ├── vite.config.js
│   ├── .env / .env.example
│   └── README.md            # Default Vite template stub
├── fix_da_section.py
├── fix_livepreview.py
├── LivePreview_orig.js
├── nul
└── README.md                # This file

## Overview

**AI TechHub** is a smart technology platform that combines:

- **AI Chat** — conversations backed by Gemini (cloud) with automatic per-model failover, or Ollama (local) inference.
- **Code Studio** — an in-browser editor with a live preview pane for HTML/JS/CSS.
- **Document Studio** — document upload, processing, and retrieval-augmented generation (RAG).
- **Image Studio** — image generation and synthesis (Stability AI / Ollama LLaVA).
- **Workflows** — visual workflow builder.
- **Projects** — group related conversations, documents, and generations.
- **Usage & Admin** — usage tracking, rate limiting, role-based access (ADMIN/USER) and plans (ADMIN/PRO).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Flask 3, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Flask-Limiter, Flask-CORS |
| Database | MySQL (via PyMySQL), migrations via Flask-Migrate |
| Auth | JWT access/refresh tokens, argon2 password hashing |
| Background jobs | Celery + Redis (document processing, image generation, cleanup) |
| AI Providers | Google Gemini (cloud, primary with failover chain), Ollama (local: llama3.1, qwen2.5-coder, llava), Stability AI |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router DOM, TanStack React Query, Framer Motion, Lucide React, React Hook Form + Zod, React Markdown |
| Linting | Oxlint |
| Server | gunicorn (production), Flask dev server (local) |

## Prerequisites

- Python 3.11+ (backend)
- Node.js 18+ and npm (frontend)
- MySQL 8+ (or a MySQL-compatible database)
- Redis 6+ (Celery broker & result backend, rate-limit storage)
- Optional: Ollama running locally (`http://localhost:11434`) for local AI models
- Optional: Gemini API key (cloud provider) — set `GEMINI_API_KEY` in backend `.env`

## Quick Start

### 1. Backend

```powershell
cd "c:/Users/goodp/OneDrive/AITechHubSmartTechnologyPlatform/backend"
```

Create and activate a virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Copy the environment example and adjust values:

```powershell
copy .env.example .env
```

Minimum required edits in `.env`:
- `DATABASE_URL` — your MySQL connection string
- `SECRET_KEY` / `JWT_SECRET_KEY` — long random strings
- `GEMINI_API_KEY` — if using the Gemini cloud provider

Initialize the database and seed demo accounts:

```powershell
flask init-db
python seed_demo.py
```

Seed output (default credentials):
- Admin: `admin@aitechhub.local` / `AdminPass123!`
- Demo: `demo@aitechhub.local` / `DemoPass123!`

Run the backend (Flask dev server on http://localhost:5000):

```powershell
python run.py
```

Or with gunicorn (production-like):

```powershell
gunicorn --bind 0.0.0.0:5000 --workers 4 --threads 2 run:app
```

Run a Celery worker (required for background document/image tasks):

```powershell
celery -A celery_worker.celery worker --loglevel=info --pool=solo
```

Run tests:

```powershell
### 2. Frontend

```powershell
cd "c:/Users/goodp/OneDrive/AITechHubSmartTechnologyPlatform/frontend"
```

Install dependencies:

```powershell
npm install
```

Copy environment example:

```powershell
copy .env.example .env
```

`VITE_API_URL=/api` proxies API calls to the backend during development (Vite dev server).

Start the dev server (http://localhost:5173 by default):

```powershell
npm run dev
```

Other scripts:

```powershell
npm run build   # production build to dist/
npm run preview # preview production build locally
npm run lint    # oxlint
```

### 3. Using Docker (backend only)

```powershell
cd backend
docker build -t aitechhub-backend .
docker run -p 5000:5000 --env-file .env aitechhub-backend
```

## Default Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aitechhub.local | AdminPass123! |
| Demo user | demo@aitechhub.local | DemoPass123! |

⚠️ Change these passwords in production.

## Environment Variables

### Backend (`.env`)

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `FLASK_ENV` | Flask environment | `development` |
| `SECRET_KEY` | Flask secret key | `change-me-to-a-long-random-string` |
| `APP_DEBUG` | Debug mode | `True` |
| `DATABASE_URL` | SQLAlchemy MySQL URI | `mysql+pymysql://root:password@localhost:3306/ai_tech_hub` |
| `JWT_SECRET_KEY` | JWT signing key | `change-me-to-another-long-random-string` |
| `JWT_ACCESS_TOKEN_EXPIRES` | Access token TTL (seconds) | `3600` |
| `JWT_REFRESH_TOKEN_EXPIRES` | Refresh token TTL (seconds) | `2592000` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://localhost:5173` |
| `RATELIMIT_STORAGE_URL` | Redis for rate limiting | `redis://localhost:6379/1` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL` | Celery broker | `redis://localhost:6379/2` |
| `CELERY_RESULT_BACKEND` | Celery result backend | `redis://localhost:6379/3` |
| `DEFAULT_AI_PROVIDER` | `gemini` or `ollama` | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key | `your-gemini-api-key-here` |
| `GEMINI_MODEL` | Primary Gemini model | `gemini-2.5-flash-lite` |
| `GEMINI_FALLBACK_MODELS` | Fallback model chain | `gemini-flash-lite-latest,...` |
| `GEMINI_CACHE_TTL_MS` | Prompt cache TTL (ms) | `300000` |
| `OLLAMA_BASE_URL` | Ollama endpoint | `http://localhost:11434` |
| `OLLAMA_DEFAULT_CHAT_MODEL` | Local chat model | `llama3.1` |
| `OLLAMA_DEFAULT_CODE_MODEL` | Local code model | `qwen2.5-coder` |
| `OLLAMA_DEFAULT_IMAGE_MODEL` | Local image model | `llava` |
| `UPLOAD_FOLDER` | Upload directory | `./uploads` |
| `MAX_CONTENT_LENGTH` | Max upload size (bytes) | `26214400` (25 MB) |
| `ALLOWED_EXTENSIONS` | Allowed upload extensions | `txt,md,pdf,docx,png,jpg,jpeg,gif,webp` |

### Frontend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base API URL for the frontend | `/api` |
## Project Structure Details

### Backend blueprints (`app/api/`)
- `auth` — login, register, refresh, logout
- `users` — user management, roles, plans
- `projects` — project CRUD
- `chat` — conversations and messages
- `documents` — upload, processing, RAG retrieval
- `image_studio` — image generation
- `code_studio` — code generation/execution helpers
- `workflows` — workflow definitions
- `usage` — usage tracking and quotas
- `mcp` — Model Context Protocol endpoints
- `admin` — admin-only operations

### Frontend features (`src/features/`)
- `dashboard` — home dashboard
- `projects` — project list and detail
- `code-studio` — editor + live preview (`CodeEditor.jsx`, `LivePreview.jsx`, `CodeStudioPage.jsx`)
- `documents` — document management
- `image-studio` — image generation UI
- `workflows` — workflow builder
- `settings` — user settings
- `usage` — usage statistics
- `public/` — landing, features, pricing, privacy, terms pages

### Backend services (`app/services/`)
- `chat_service.py` — conversation/message orchestration
- `document_service.py` — document processing pipeline
- `image_service.py` — image generation jobs
- `code_service.py` — code execution helpers
- `retrieval_service.py` — RAG retrieval
- `usage_service.py` — metering and quotas
- `ai/` — provider abstraction: `gemini_provider.py`, `ollama_provider.py`, `stability_provider.py`, `model_manager.py`, `registry.py`

### Background tasks (`app/tasks/`)
- `document_tasks.py` — async document processing
- `image_tasks.py` — async image generation
- `cleanup_tasks.py` — periodic cleanup

## Available Scripts

### Root

There are no root-level scripts yet. Run backend and frontend commands from their respective directories.

### Backend

| Command | Purpose |
|---------|---------|
| `python run.py` | Start Flask dev server (port 5000) |
| `flask init-db` | Create all database tables |
| `python seed_demo.py` | Seed admin/demo accounts and starter project |
| `celery -A celery_worker.celery worker --loglevel=info --pool=solo` | Run Celery worker |
| `gunicorn --bind 0.0.0.0:5000 --workers 4 --threads 2 run:app` | Production WSGI server |
| `pytest` | Run test suite |

### Frontend

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production (`dist/`) |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

## Contributing

1. Copy `.env.example` to `.env` in both `backend/` and `frontend/`.
2. Backend: `pip install -r requirements.txt`, `flask init-db`, `python seed_demo.py`.
3. Frontend: `npm install`, `npm run dev`.
4. Run a Celery worker alongside the backend for background jobs.
5. Lint before committing: `npm run lint` (frontend); keep Python code PEP-8-ish and testable with `pytest`.

## Notes

- The `frontend/README.md` is the default Vite + React template stub and does not document this project.
- `fix_da_section.py`, `fix_livepreview.py`, and `LivePreview_orig.js` at the root appear to be one-off repair scripts for the code-studio live preview feature.
- The default AI provider is Gemini; if no `GEMINI_API_KEY` is configured, Ollama is used as the local fallback. Set `DEFAULT_AI_PROVIDER=ollama` to force local-only inference.# AITechHubSmartTechnologyPlatform
