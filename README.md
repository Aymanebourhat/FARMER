# Morocco Livestock Platform

A locally runnable V1 prototype for Moroccan livestock farmers, public buyers, verified vets, and platform administrators.

## Local containers

1. Copy placeholders from `backend/.env.example` and choose a strong `SECRET_KEY` outside source control.
2. Run `docker compose up --build -d`.
3. Open the frontend at `http://localhost:3000/en` (also `ar`, `ary`, and `fr`) and API docs at `http://localhost:8000/docs` when enabled.
4. Create the first admin from the backend container:
   `docker compose exec backend python -m app.scripts.create_admin --full-name "Platform Admin" --phone "+212..."`

The backend container applies Alembic migrations before starting. PostgreSQL, public animal photos, and private vet documents use separate persistent volumes. Back up the database and both upload volumes before upgrades; Compose volumes are persistence, not a backup strategy.

## Native development

Backend: create/activate `backend/.venv`, install `.[dev]`, copy `.env.example` to an untracked `.env`, run `alembic upgrade head`, then `uvicorn app.main:app --reload`.

Frontend: run `npm install` and `npm run dev` from `frontend` with `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`.

## Release checks

- Backend: `python -m compileall app`, `python -m pytest -q`, and `alembic upgrade head`.
- Frontend: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Containers: `docker compose config`, `docker compose build`, `docker compose up -d`, and `docker compose ps`.

The V1 rate limiter is in process and suitable only for a single backend instance. Horizontally scaled deployment needs a shared limiter. This repository does not claim production-grade scalability.
