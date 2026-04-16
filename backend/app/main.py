from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter

from app.api.v1.router import api_router
from app.config import settings
from app.db.session import engine
from app.models.base import Base # Added Base for auto-creation
from app.models.user import Organization, User
from app.models.device import Device
from app.models.sensor_reading import SensorReading
from app.middleware.request_id import RequestIDMiddleware
from app.workers.celery_app import celery_app

logger = structlog.get_logger(__name__)


async def _ensure_seed_data() -> None:
    """Safe seeding of demo organization and device for IoT testing."""
    from sqlalchemy import select
    from app.db.session import AsyncSessionLocal
    import uuid

    async with AsyncSessionLocal() as session:
        # 1. Ensure Organization
        org_res = await session.execute(select(Organization).where(Organization.name == "Demo Organization"))
        org = org_res.scalar_one_or_none()
        if not org:
            org = Organization(
                id=uuid.uuid4(),
                name="Demo Organization",
                region="us-east-1"
            )
            session.add(org)
            await session.flush()
            logger.info("Seeded Demo Organization", org_id=org.id)
        
        # 2. Ensure ESP32 Test Device
        device_id = uuid.UUID("d1e2b3c4-a5b6-4c7d-8e9f-0a1b2c3d4e5f")
        dev_res = await session.execute(select(Device).where(Device.id == device_id))
        if not dev_res.scalar_one_or_none():
            device = Device(
                id=device_id,
                organization_id=org.id,
                name="Smart Cold Box - 01",
                location_lat=28.6139,
                location_lng=77.2090,
                location_label="Main Lab",
                thing_name="esp32_test_node_01"
            )
            session.add(device)
            logger.info("Seeded ESP32 Test Device", device_id=device_id)
        
        await session.commit()

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

        # Run safe seeding
        await _ensure_seed_data()
        
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
