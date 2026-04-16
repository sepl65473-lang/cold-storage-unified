"""Alert evaluation Celery tasks — runs via Beat every 60 seconds."""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

import structlog
from celery import shared_task
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import AsyncSessionLocal
from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.device import Device, DeviceStatus
from app.models.sensor_reading import SensorReading

logger = structlog.get_logger(__name__)


def _run_async(coro):
    """Run async coroutine from sync Celery task."""
    return asyncio.get_event_loop().run_until_complete(coro)


@shared_task(name="app.workers.alert_evaluator.run_alert_evaluation", bind=True, max_retries=3)
def run_alert_evaluation(self):
    """Evaluate threshold violations for all online devices."""
    _run_async(_evaluate_thresholds())


@shared_task(name="app.workers.alert_evaluator.check_offline_devices", bind=True, max_retries=3)
def check_offline_devices(self):
    """Mark devices that have not sent a heartbeat in OFFLINE_TIMEOUT_SECONDS as offline."""
    _run_async(_detect_offline_devices())


async def _evaluate_thresholds() -> None:
    async with AsyncSessionLocal() as db:
        # Fetch the most recent reading per device (last 2 minutes window)
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=2)
        result = await db.execute(
            select(SensorReading)
            .where(SensorReading.time >= cutoff)
            .order_by(SensorReading.device_id, SensorReading.time.desc())
            .distinct(SensorReading.device_id)
        )
        readings = result.scalars().all()

        for reading in readings:
            await _check_temperature(db, reading)
            await _check_battery(db, reading)
            await _check_door(db, reading)

        await db.commit()


async def _check_temperature(db: AsyncSession, reading: SensorReading) -> None:
    if reading.temperature is None:
        return
    if reading.temperature > settings.TEMP_MAX_C:
        await _raise_alert(
            db,
            device_id=reading.device_id,
            alert_type=AlertType.TEMP_HIGH,
            severity=AlertSeverity.CRITICAL,
            message=f"Temperature {reading.temperature:.1f}°C exceeds maximum {settings.TEMP_MAX_C}°C",
        )
    elif reading.temperature < settings.TEMP_MIN_C:
        await _raise_alert(
            db,
            device_id=reading.device_id,
            alert_type=AlertType.TEMP_LOW,
            severity=AlertSeverity.CRITICAL,
            message=f"Temperature {reading.temperature:.1f}°C below minimum {settings.TEMP_MIN_C}°C",
        )


async def _check_battery(db: AsyncSession, reading: SensorReading) -> None:
    if reading.battery_level is None:
        return
    if reading.battery_level < settings.BATTERY_LOW_PCT:
        await _raise_alert(
            db,
            device_id=reading.device_id,
            alert_type=AlertType.BATTERY_LOW,
            severity=AlertSeverity.WARNING,
            message=f"Battery at {reading.battery_level:.0f}% — below threshold {settings.BATTERY_LOW_PCT}%",
        )


async def _check_door(db: AsyncSession, reading: SensorReading) -> None:
    if not reading.door_state:
        return
    if reading.cooling_cycle_duration and reading.cooling_cycle_duration > settings.DOOR_OPEN_MAX_SECONDS:
        await _raise_alert(
            db,
            device_id=reading.device_id,
            alert_type=AlertType.DOOR_OPEN,
            severity=AlertSeverity.WARNING,
            message=f"Door has been open for {reading.cooling_cycle_duration // 60} minutes",
        )


async def _detect_offline_devices() -> None:
    async with AsyncSessionLocal() as db:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.OFFLINE_TIMEOUT_SECONDS)
        # Devices last seen before cutoff and currently marked online
        result = await db.execute(
            select(Device).where(
                Device.last_seen < cutoff,
                Device.status.in_([DeviceStatus.ONLINE, DeviceStatus.WARNING]),
                Device.is_active == True,
            )
        )
        stale_devices = result.scalars().all()

        for device in stale_devices:
            device.status = DeviceStatus.OFFLINE
            await _raise_alert(
                db,
                device_id=device.id,
                alert_type=AlertType.OFFLINE,
                severity=AlertSeverity.CRITICAL,
                message=f"Device '{device.name}' has not reported in over {settings.OFFLINE_TIMEOUT_SECONDS // 60} minutes",
            )
            logger.warning("Device marked offline", device_id=str(device.id), name=device.name)

        await db.commit()


async def _raise_alert(
    db: AsyncSession,
    *,
    device_id,
    alert_type: AlertType,
    severity: AlertSeverity,
    message: str,
) -> Alert | None:
    # Check for an existing unresolved alert of the same type for this device
    existing = await db.execute(
        select(Alert).where(
            Alert.device_id == device_id,
            Alert.type == alert_type,
            Alert.is_resolved == False,
        )
    )
    if existing.scalar_one_or_none():
        return None  # Duplicate suppression — don't re-raise same alert

    # Fetch org_id for alert record
    device_result = await db.execute(select(Device).where(Device.id == device_id))
    device = device_result.scalar_one_or_none()
    if not device:
        return None

    alert = Alert(
        device_id=device_id,
        organization_id=device.organization_id,
        type=alert_type,
        severity=severity,
        message=message,
    )
    db.add(alert)
    await db.flush()  # Get alert.id before commit

    # Dispatch notification asynchronously (separate Celery task)
    from app.workers.notification_dispatcher import dispatch_alert_notification
    dispatch_alert_notification.apply_async(
        args=[str(alert.id)],
        queue="notifications",
    )

    logger.warning("Alert raised", alert_type=alert_type, device_id=str(device_id))
    return alert
