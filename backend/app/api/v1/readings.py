"""TimescaleDB SensorReadings API — raw series, hourly aggregates, daily aggregates."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException, Query, Header, status, Request
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.config import settings
from app.dependencies import get_current_org_id
from app.models.device import Device
from app.models.sensor_reading import SensorReading
from app.models.user import User
from app.schemas.reading import SensorReadingAggregatedResponse, SensorReadingResponse, SensorReadingIngest

router = APIRouter()


async def _verify_device_ownership(device_id: uuid.UUID, org_id: uuid.UUID, db: AsyncSession) -> None:
    """Ensure the requested device belongs to the user's organization."""
    result = await db.execute(select(Device.id).where(Device.id == device_id, Device.organization_id == org_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Device not found in your organization")




@router.get("/debug-headers")
async def debug_headers(request: Request):
    """Debug endpoint to verify CloudFront header forwarding."""
    return {
        "headers": dict(request.headers),
        "query_params": dict(request.query_params),
        "url": str(request.url),
        "client": request.client.host if request.client else "unknown"
    }


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
@router.post("/ingest/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def ingest_sensor_data(
    request: Request,
    payload: SensorReadingIngest,
    db: AsyncSession = Depends(get_db),
):
    """
    HTTP POST endpoint for IoT devices to push telemetry data.
    Requires X-API-KEY internal header (manually checked below).
    """
    import logging
    logger = logging.getLogger("app.readings")
    raw_body = await request.body()
    logger.info(
        "TELEMETRY INGESTION ATTEMPT",
        path=str(request.url.path),
        method=request.method,
        user_agent=request.headers.get("user-agent"),
        raw_body_preview=raw_body.decode()[:100] if raw_body else None
    )

    # ─── Auth Verification ────────────────────────────────────────────────────
    # Manual header check (case-insensitive) + Query Param fallback for hardware resiliency
    h_api_key = request.headers.get("X-API-KEY") or request.headers.get("x-api-key")
    q_api_key = request.query_params.get("api_key")
    
    current_key = h_api_key or q_api_key
    
    if current_key != settings.IOT_INGEST_TOKEN:
        logger.warning(f"AUTH FAILED: Header={h_api_key} Query={q_api_key} Expected={settings.IOT_INGEST_TOKEN}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid IoT Ingest Token"
        )
    
    # ─── Auto-Registration Logic ──────────────────────────────────────────────
    device_result = await db.execute(select(Device).where(Device.id == payload.device_id))
    device = device_result.scalar_one_or_none()
    
    if not device:
        from app.models.user import Organization
        # 1. Ensure Demo Organization exists
        org_result = await db.execute(select(Organization).where(Organization.name == "Demo Organization"))
        org = org_result.scalar_one_or_none()
        
        if not org:
            org = Organization(
                id=uuid.uuid4(),
                name="Demo Organization",
                region="us-east-1"
            )
            db.add(org)
            await db.flush()
        
        # 2. Auto-register Device
        device = Device(
            id=payload.device_id,
            organization_id=org.id,
            name=f"IoT Node: {str(payload.device_id)[:8]}",
            status="online"
        )
        db.add(device)
        await db.commit()
        await db.refresh(device)
    # ──────────────────────────────────────────────────────────────────────────

    # Create reading
    reading = SensorReading(
        time=payload.time or datetime.now(timezone.utc),
        device_id=payload.device_id,
        temperature=payload.temperature,
        humidity=payload.humidity,
        battery_level=payload.battery_level,
        solar_power_watts=payload.solar_power_watts,
        compressor_state=payload.compressor_state,
        door_state=payload.door_state,
        cooling_cycle_duration=payload.cooling_cycle_duration
    )
    
    db.add(reading)
    await db.commit()
    
    return {"status": "success", "timestamp": reading.time}


class BatchIngestReading(BaseModel):
    temperature: float
    humidity: float
    battery_level: float | None = None
    solar_power_watts: float | None = None
    compressor_state: bool | None = None
    door_state: bool | None = None
    cooling_cycle_duration: int | None = None
    time: datetime | None = None

class BatchIngestPayload(BaseModel):
    device_id: uuid.UUID
    readings: list[BatchIngestReading]

@router.post("/batch-ingest", status_code=status.HTTP_201_CREATED)
async def ingest_batch_sensor_data(
    payload: BatchIngestPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    HTTP POST endpoint for IoT devices to push multiple telemetry data points at once.
    """
    h_api_key = request.headers.get("X-API-KEY") or request.headers.get("x-api-key")
    if h_api_key != settings.IOT_INGEST_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid IoT Ingest Token")

    if not payload.readings:
        return {"status": "skipped", "count": 0}

    device_id = payload.device_id
    device_result = await db.execute(select(Device).where(Device.id == device_id))
    device = device_result.scalar_one_or_none()
    
    if not device:
        from app.models.user import Organization
        org_result = await db.execute(select(Organization).where(Organization.name == "Demo Organization"))
        org = org_result.scalar_one_or_none()
        if not org:
            org = Organization(id=uuid.uuid4(), name="Demo Organization", region="us-east-1")
            db.add(org)
            await db.flush()
        
        device = Device(id=device_id, organization_id=org.id, name=f"IoT Node: {str(device_id)[:8]}", status="online")
        db.add(device)
        await db.flush()

    readings = [
        SensorReading(
            time=p.time or datetime.now(timezone.utc),
            device_id=device_id,
            temperature=p.temperature,
            humidity=p.humidity,
            battery_level=p.battery_level,
            solar_power_watts=p.solar_power_watts,
            compressor_state=p.compressor_state,
            door_state=p.door_state,
            cooling_cycle_duration=p.cooling_cycle_duration
        )
        for p in payload.readings
    ]
    
    db.add_all(readings)
    await db.commit()
    
    return {"status": "success", "count": len(readings)}


@router.get("/{device_id}/raw", response_model=list[SensorReadingResponse])

async def get_raw_readings(
    device_id: uuid.UUID,
    start_time: datetime = Query(default_factory=lambda: datetime.now(timezone.utc) - timedelta(hours=24)),
    end_time: datetime = Query(default_factory=lambda: datetime.now(timezone.utc)),
    limit: int = Query(1000, le=5000),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> Sequence[SensorReading]:
    """Fetch raw hypertable rows (optimized for < 24h charts)."""
    await _verify_device_ownership(device_id, org_id, db)

    result = await db.execute(
        select(SensorReading)
        .where(
            SensorReading.device_id == device_id,
            SensorReading.time >= start_time,
            SensorReading.time <= end_time,
        )
        .order_by(SensorReading.time.asc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{device_id}/hourly", response_model=list[SensorReadingAggregatedResponse])
async def get_hourly_aggregates(
    device_id: uuid.UUID,
    start_time: datetime = Query(default_factory=lambda: datetime.now(timezone.utc) - timedelta(days=7)),
    end_time: datetime = Query(default_factory=lambda: datetime.now(timezone.utc)),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> list[dict]:
    """Fetch from continuous aggregate view `sensor_readings_hourly` (optimized for 7d-30d charts)."""
    await _verify_device_ownership(device_id, org_id, db)

    # Use raw SQL as materialized views aren't natively mapped in SQLAlchemy 2.0 declarative easily
    stmt = text("""
        SELECT bucket, device_id, avg_temperature, avg_humidity,
               avg_battery_level, avg_solar_power_watts, sample_count
        FROM sensor_readings_hourly
        WHERE device_id = :device_id
          AND bucket >= :start
          AND bucket <= :end
        ORDER BY bucket ASC
    """)
    result = await db.execute(stmt, {"device_id": device_id, "start": start_time, "end": end_time})
    rows = result.mappings().all()
    return list(rows)


@router.get("/{device_id}/daily", response_model=list[SensorReadingAggregatedResponse])
async def get_daily_aggregates(
    device_id: uuid.UUID,
    start_time: datetime = Query(default_factory=lambda: datetime.now(timezone.utc) - timedelta(days=90)),
    end_time: datetime = Query(default_factory=lambda: datetime.now(timezone.utc)),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> list[dict]:
    """Fetch from continuous aggregate view `sensor_readings_daily` (optimized for multi-month charts)."""
    await _verify_device_ownership(device_id, org_id, db)

    stmt = text("""
        SELECT bucket, device_id, avg_temperature, avg_humidity,
               avg_battery_level, avg_solar_power_watts, sample_count
        FROM sensor_readings_daily
        WHERE device_id = :device_id
          AND bucket >= :start
          AND bucket <= :end
        ORDER BY bucket ASC
    """)
    result = await db.execute(stmt, {"device_id": device_id, "start": start_time, "end": end_time})
    rows = result.mappings().all()
    return list(rows)
