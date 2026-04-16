"""Telemetry ingest Celery task — consumes SQS messages from IoT Core fan-out."""
from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Any

import structlog
from celery import shared_task
from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.device import Device, DeviceStatus
from app.models.sensor_reading import SensorReading
from app.models.user import Organization

logger = structlog.get_logger(__name__)


def _run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@shared_task(name="app.workers.ingest.ingest_telemetry", bind=True, max_retries=3, default_retry_delay=5)
def ingest_telemetry(self, payload: dict[str, Any]):
    """
    Receives raw MQTT telemetry payload (forwarded from AWS IoT Core → SQS → Celery).
    Validates, inserts SensorReading, and updates device last_seen.
    """
    try:
        _run_async(_process_telemetry(payload))
    except Exception as exc:
        logger.error("Telemetry ingest failed", error=str(exc), payload=payload)
        raise self.retry(exc=exc)


@shared_task(name="app.workers.ingest.process_device_status")
def process_device_status(payload: dict[str, Any]):
    """Handle LWT (Last Will) offline status messages."""
    device_id = payload.get("device_id")
    status = payload.get("status")
    if status == "offline" and device_id:
        _run_async(_mark_device_offline(device_id))


async def _process_telemetry(payload: dict[str, Any]) -> None:
    logger.info("Processing telemetry payload", payload=payload)
    device_id_str = payload.get("device_id")
    if not device_id_str:
        logger.warning("Telemetry payload missing device_id", payload=payload)
        return

    try:
        device_id = uuid.UUID(device_id_str)
    except ValueError:
        logger.warning("Invalid device_id in telemetry", device_id=device_id_str)
        return

    ts = payload.get("timestamp")
    reading_time = datetime.fromisoformat(ts) if ts else datetime.now(timezone.utc)

    async with AsyncSessionLocal() as db:
        # INSERT reading — TimescaleDB handles partitioning automatically
        reading = SensorReading(
            time=reading_time,
            device_id=device_id,
            temperature=payload.get("temperature"),
            humidity=payload.get("humidity"),
            battery_level=payload.get("battery_level"),
            solar_power_watts=payload.get("solar_power_watts"),
            compressor_state=payload.get("compressor_state"),
            door_state=payload.get("door_state"),
            cooling_cycle_duration=payload.get("cooling_cycle_duration"),
        )
        db.add(reading)

        # Update device.last_seen, status, and location
        update_values = {
            "last_seen": reading_time,
            "status": DeviceStatus.ONLINE
        }
        
        if payload.get("location_lat") is not None:
             update_values["location_lat"] = payload.get("location_lat")
        if payload.get("location_lng") is not None:
             update_values["location_lng"] = payload.get("location_lng")

        await db.execute(
            update(Device)
            .where(Device.id == device_id)
            .values(**update_values)
        )
        # Fetch organization_id to routing to correct WebSocket listeners
        from sqlalchemy import select
        res = await db.execute(select(Device.organization_id).where(Device.id == device_id))
        org_id = res.scalar_one_or_none()
        
        await db.commit()

    # Publish to Redis for real-time WebSocket stream
    if org_id:
        try:
            import redis
            from app.config import settings
            r = redis.from_url(settings.REDIS_URL)
            payload["organization_id"] = str(org_id)
            # Add any extra info needed by frontend
            payload["status"] = update_values["status"]
            r.publish("telemetry_stream", json.dumps(payload))
        except Exception as e:
            logger.error("Failed to publish to Redis stream", error=str(e))

    logger.debug("Telemetry ingested", device_id=device_id_str, time=str(reading_time))


async def _mark_device_offline(device_id: str) -> None:
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Device)
            .where(Device.id == uuid.UUID(device_id))
            .values(status=DeviceStatus.OFFLINE)
        )
        await db.commit()
    logger.info("Device marked offline via LWT", device_id=device_id)
