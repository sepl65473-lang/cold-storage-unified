from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id
from app.models.alert import Alert
from app.models.device import Device
from app.models.settings import OrganizationSettings
from app.models.user import User
from app.models.sensor_reading import SensorReading


router = APIRouter()


async def _get_online_timeout_seconds(db: AsyncSession, org_id: uuid.UUID) -> int:
    result = await db.execute(
        select(OrganizationSettings.heartbeat_interval_minutes).where(
            OrganizationSettings.organization_id == org_id
        )
    )
    minutes = result.scalar_one_or_none() or 5
    return max(int(minutes), 1) * 60

@router.get("/chambers")
async def get_chambers(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> list[dict[str, Any]]:
    """Fetch all devices visible to the authenticated organization."""
    result = await db.execute(select(Device).where(Device.organization_id == org_id))
    devices = result.scalars().all()
    online_timeout_seconds = await _get_online_timeout_seconds(db, org_id)
    
    chambers = []
    for dev in devices:
        # Get latest reading for each device
        reading_res = await db.execute(
            select(SensorReading)
            .where(SensorReading.device_id == dev.id)
            .order_by(SensorReading.time.desc())
            .limit(1)
        )
        reading = reading_res.scalar_one_or_none()
        
        current_time = datetime.now(timezone.utc)
        is_online = reading and (current_time - reading.time).total_seconds() < online_timeout_seconds
        
        chambers.append({
            "id": str(dev.id),
            "name": dev.name,
            "temp": reading.temperature if reading else 0.0,
            "humidity": reading.humidity if reading else 0.0,
            "status": "online" if is_online else "offline",
            "doorStatus": "open" if reading and reading.door_state else "closed"
        })
    return chambers

@router.get("/stats")
async def get_stats(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> dict[str, Any]:
    """Calculate dashboard stats for the authenticated organization only."""
    devices_res = await db.execute(select(Device).where(Device.organization_id == org_id))
    devices = devices_res.scalars().all()
    online_timeout_seconds = await _get_online_timeout_seconds(db, org_id)

    alert_count_res = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.organization_id == org_id,
            Alert.is_resolved == False,
        )
    )
    active_alerts = int(alert_count_res.scalar_one() or 0)

    if not devices:
        return {
            "avgTemp": 0.0,
            "avgHumidity": 0.0,
            "activeChambers": 0,
            "totalChambers": 0,
            "activeAlerts": active_alerts,
            "doorsOpen": 0
        }

    latest_readings = []
    for dev in devices:
        reading_res = await db.execute(
            select(SensorReading)
            .where(SensorReading.device_id == dev.id)
            .order_by(SensorReading.time.desc())
            .limit(1)
        )
        r = reading_res.scalar_one_or_none()
        if r:
            latest_readings.append(r)

    if not latest_readings:
        return {
            "avgTemp": 0.0,
            "avgHumidity": 0.0,
            "activeChambers": 0,
            "totalChambers": len(devices),
            "activeAlerts": active_alerts,
            "doorsOpen": 0
        }

    avg_temp = sum(r.temperature for r in latest_readings) / len(latest_readings)
    avg_hum = sum(r.humidity for r in latest_readings) / len(latest_readings)
    doors_open = sum(1 for r in latest_readings if r.door_state)
    active_count = sum(
        1 for r in latest_readings
        if (datetime.now(timezone.utc) - r.time).total_seconds() < online_timeout_seconds
    )

    return {
        "avgTemp": round(float(avg_temp), 1),
        "avgHumidity": round(float(avg_hum), 1),
        "activeChambers": active_count,
        "totalChambers": len(devices),
        "activeAlerts": active_alerts,
        "doorsOpen": doors_open
    }


@router.get("/history/temperature")
async def get_temperature_history(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    """Compatibility endpoint for dashboard 'Temperature Trends' showing latest org data."""
    result = await db.execute(
        select(SensorReading)
        .join(Device, SensorReading.device_id == Device.id)
        .where(Device.organization_id == org_id)
        .order_by(SensorReading.time.desc())
        .limit(24)
    )
    readings = list(result.scalars().all())
    readings.reverse() # Show in chronological order for the chart
    
    return [
        {
            "time": r.time.strftime("%H:%M"),
            "temp": round(float(r.temperature), 1) if r.temperature is not None else None,
        }
        for r in readings
    ]

@router.get("/history/humidity")
async def get_humidity_history(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    """Compatibility endpoint for dashboard 'Humidity Trends'."""
    result = await db.execute(
        select(SensorReading)
        .join(Device, SensorReading.device_id == Device.id)
        .where(Device.organization_id == org_id)
        .order_by(SensorReading.time.asc())
        .limit(24)
    )
    readings = result.scalars().all()
    return [
        {
            "time": r.time.strftime("%H:%M"),
            "val": r.humidity
        }
        for r in readings
    ]

@router.get("/distribution/zones")
async def get_zone_distribution(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    """Real humidity distribution per device for the authenticated org."""
    result = await db.execute(select(Device).where(Device.organization_id == org_id))
    devices = result.scalars().all()

    zones = []
    for dev in devices:
        reading_res = await db.execute(
            select(SensorReading)
            .where(SensorReading.device_id == dev.id)
            .order_by(SensorReading.time.desc())
            .limit(1)
        )
        reading = reading_res.scalar_one_or_none()
        if reading and reading.humidity is not None:
            zones.append({"name": dev.name, "value": round(float(reading.humidity), 1)})

    return zones
