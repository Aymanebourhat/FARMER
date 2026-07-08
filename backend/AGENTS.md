# backend/AGENTS.md

## Backend-specific rules

- Use FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL.
- Keep each domain module structured as `models.py`, `schemas.py`, `routes.py`, `service.py`, `repository.py` when applicable.
- Do not put business logic directly in route handlers.
- Use transactions for listing creation and animal status updates.
- Use migrations for schema changes.
- Tests are required for permissions, validation, and marketplace business rules.
- Never hardcode secrets.
- Do not implement out-of-scope V1 features.
