# Backend

FastAPI modular monolith using SQLAlchemy, Alembic, PostgreSQL, JWT access tokens, private vet-document storage, public optimized animal photos, and audited admin moderation.

## Setup

Copy `.env.example` to an untracked `.env`, replace `SECRET_KEY`, install `.[dev]`, then run:

```powershell
alembic upgrade head
uvicorn app.main:app --reload
```

Create administrators only through the script:

```powershell
python -m app.scripts.create_admin --full-name "Platform Admin" --phone "+212600000000"
```

Production configuration rejects placeholder/short secrets, debug mode, and wildcard credentialed CORS. Configure `TRUSTED_HOSTS`; disable docs with `ENABLE_DOCS=false` when appropriate. `RATE_LIMIT_ENABLED` controls the single-process V1 limiter, with separate auth, upload, and mutation thresholds.

`LOCAL_UPLOAD_DIR` is public animal-photo storage. `VET_DOCUMENT_UPLOAD_DIR` is private and must never be mounted as static content. Back up the database and both upload stores together.

## Validation

```powershell
python -m compileall app
python -c "import tomllib; tomllib.load(open('pyproject.toml','rb')); print('pyproject.toml OK')"
alembic upgrade head
python -m pytest -q
```
