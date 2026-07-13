from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.rate_limit import RateLimitMiddleware
from app.modules.admin.routes import router as admin_router
from app.modules.admin.vet_routes import router as admin_vets_router
from app.modules.animals.routes import router as animals_router
from app.modules.auth.routes import router as auth_router
from app.modules.farmers.routes import router as farmers_router
from app.modules.health.routes import router as health_router
from app.modules.marketplace.routes import router as marketplace_router
from app.modules.vets.routes import router as vets_router
from app.modules.weights.routes import router as weights_router

settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url="/redoc" if settings.enable_docs else None,
    openapi_url="/openapi.json" if settings.enable_docs else None,
)
app.mount("/uploads", StaticFiles(directory=settings.local_upload_dir, check_dir=False), name="uploads")
app.add_middleware(RateLimitMiddleware, settings=settings)
if settings.trusted_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


@app.get("/api/v1/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router, prefix="/api/v1")
app.include_router(farmers_router, prefix="/api/v1")
app.include_router(animals_router, prefix="/api/v1")
app.include_router(weights_router, prefix="/api/v1")
app.include_router(health_router, prefix="/api/v1")
app.include_router(marketplace_router, prefix="/api/v1")
app.include_router(vets_router, prefix="/api/v1")
app.include_router(admin_vets_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
