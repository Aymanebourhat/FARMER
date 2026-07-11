from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.modules.animals.routes import router as animals_router
from app.modules.auth.routes import router as auth_router
from app.modules.farmers.routes import router as farmers_router
from app.modules.health.routes import router as health_router
from app.modules.weights.routes import router as weights_router


settings = get_settings()

app = FastAPI(title=settings.app_name)
app.mount(
    "/uploads",
    StaticFiles(directory=settings.local_upload_dir, check_dir=False),
    name="uploads",
)

if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/api/v1/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router, prefix="/api/v1")
app.include_router(farmers_router, prefix="/api/v1")
app.include_router(animals_router, prefix="/api/v1")
app.include_router(weights_router, prefix="/api/v1")
app.include_router(health_router, prefix="/api/v1")
