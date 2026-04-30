from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.api.v1.router import api_router
from app.config import settings
from app.db.session import engine
from app.models.base import Base
from app.middleware.request_id import RequestIDMiddleware

logger = structlog.get_logger(__name__)


def _json_safe_validation_errors(errors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    safe_errors = []
    for error in errors:
        safe_error = dict(error)
        ctx = safe_error.get("ctx")
        if isinstance(ctx, dict):
            safe_error["ctx"] = {key: str(value) for key, value in ctx.items()}
        safe_errors.append(safe_error)
    return safe_errors



@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup → yield → shutdown."""
    logger.info("Starting Cold Storage API", version="1.0.0", environment=settings.ENVIRONMENT)

    # Verify database connectivity and ensure tables exist
    try:
        async with engine.begin() as conn:
            # Check connection
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
            logger.info("Database connection verified")
            
            # Ensure tables exist (Phase 2 fix)
            def run_create_all(connection):
                Base.metadata.create_all(bind=connection)
            
            await conn.run_sync(run_create_all)
            logger.info("Database tables verified/created")

    except Exception as exc:
        logger.error("Database initialization failed at startup (Container will stay alive for retries)", error=str(exc))
        # We do NOT raise here to allow the container to stay alive, pass health checks, and retry 
        # connection during subsequent requests.

    # Start MQTT Bridge (dev mode — subscribes to Mosquitto and routes to Celery)
    mqtt_bridge = None
    if settings.ENVIRONMENT != "production":
        try:
            from app.mqtt.client import get_mqtt_bridge
            mqtt_bridge = get_mqtt_bridge()
            mqtt_bridge.start()
            logger.info("MQTT Bridge started")
        except Exception as exc:
            logger.warning("MQTT Bridge failed to start", error=str(exc))

    yield  # ← Application runs here

    # Shutdown
    if mqtt_bridge:
        mqtt_bridge.stop()
    logger.info("Shutting down Cold Storage API")
    await engine.dispose()


def create_application() -> FastAPI:
    application = FastAPI(
        title="Solar Cold Storage Monitoring Platform",
        description="Enterprise IoT platform for solar-powered cold storage fleet management.",
        version="1.0.0",
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
        openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = _json_safe_validation_errors(exc.errors())
        body = await request.body()
        logger.error("VALIDATION ERROR DETAIL", errors=errors, body=body)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": errors, "body": str(body)},
        )

    # ── CORS ──────────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        # Browsers disallow `Access-Control-Allow-Origin: *` when credentials are enabled.
        # Keep credentials enabled (cookie auth fallback), so restrict origins explicitly.
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request ID tracing ────────────────────────────────────────────────────
    application.add_middleware(RequestIDMiddleware)

    # ── Routes ────────────────────────────────────────────────────────────────
    application.include_router(api_router, prefix="/api/v1")

    # FastAPIInstrumentor.instrument_app(application)

    # ── Health check (no auth) ────────────────────────────────────────────────
    @application.get("/health", tags=["Health"])
    async def health_check() -> dict:
        return {"status": "ok", "version": "1.0.0", "environment": settings.ENVIRONMENT}

    return application


app = create_application()
