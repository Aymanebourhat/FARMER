from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.core.config import Settings
from app.core.rate_limit import RateLimitMiddleware
from app.core.security import create_access_token


BASE = {
    "DATABASE_URL": "sqlite+aiosqlite:///:memory:",
    "SECRET_KEY": "test-secret-key-for-phase-one-32-bytes-minimum",
}


def settings(**overrides: object) -> Settings:
    values = {**BASE, **overrides}
    return Settings(_env_file=None, **values)


async def test_rate_limiter_returns_429_retry_after_and_isolates_users() -> None:
    app = FastAPI()
    configured = settings(RATE_LIMIT_ENABLED=True, RATE_LIMIT_AUTH_REQUESTS=1, RATE_LIMIT_MUTATION_REQUESTS=1)
    app.add_middleware(RateLimitMiddleware, settings=configured)

    @app.post("/api/v1/auth/login")
    async def login():
        return {"ok": True}

    @app.patch("/api/v1/admin/users/00000000-0000-0000-0000-000000000000/suspend")
    async def mutate():
        return {"ok": True}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        assert (await client.post("/api/v1/auth/login")).status_code == 200
        limited = await client.post("/api/v1/auth/login")
        assert limited.status_code == 429 and int(limited.headers["retry-after"]) >= 1
        first = {"Authorization": f"Bearer {create_access_token(uuid4())}"}
        second = {"Authorization": f"Bearer {create_access_token(uuid4())}"}
        assert (await client.patch("/api/v1/admin/users/00000000-0000-0000-0000-000000000000/suspend", headers=first)).status_code == 200
        assert (await client.patch("/api/v1/admin/users/00000000-0000-0000-0000-000000000000/suspend", headers=second)).status_code == 200
        assert (await client.patch("/api/v1/admin/users/00000000-0000-0000-0000-000000000000/suspend", headers=first)).status_code == 429


def test_production_configuration_rejects_placeholders_debug_and_wildcard_cors() -> None:
    for values in (
        {"APP_ENV": "production", "SECRET_KEY": "replace-with-a-long-random-secret"},
        {"APP_ENV": "production", "DEBUG": True},
        {"CORS_ORIGINS": "*"},
    ):
        try:
            settings(**values)
        except ValidationError:
            pass
        else:
            raise AssertionError(f"Unsafe settings were accepted: {values}")

    production = settings(APP_ENV="production", SECRET_KEY="a-production-secret-that-is-longer-than-thirty-two-characters", ENABLE_DOCS=False)
    assert production.environment == "production" and production.debug is False and production.enable_docs is False



async def test_disabled_rate_limiter_never_interferes() -> None:
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, settings=settings(RATE_LIMIT_ENABLED=False, RATE_LIMIT_AUTH_REQUESTS=1))

    @app.post("/api/v1/auth/login")
    async def login_unlimited():
        return {"ok": True}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for _ in range(3):
            assert (await client.post("/api/v1/auth/login")).status_code == 200

