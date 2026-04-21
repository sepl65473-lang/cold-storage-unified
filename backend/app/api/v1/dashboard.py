from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.device import Device
from app.models.sensor_reading import SensorReading
from app.schemas.device import DeviceResponse

router = APIRouter()

@router.get("/chambers")
async def get_chambers(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """Fetch all devices (Bypassing Org Filter for Debug)."""
    # Fetch all registered devices
    result = await db.execute(select(Device))
    devices = result.scalars().all()
    
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
        # Online if seen in last 10 minutes
        is_online = reading and (current_time - reading.time).total_seconds() < 600
        
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
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Calculate stats across ALL devices (Bypassing Org Filter for Debug)."""
    # Fetch all devices
    devices_res = await db.execute(select(Device))
    devices = devices_res.scalars().all()

    if not devices:
        return {
            "avgTemp": 0.0,
            "avgHumidity": 0.0,
            "activeChambers": 0,
            "totalChambers": 0,
            "activeAlerts": 0,
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
            "activeAlerts": 0,
            "doorsOpen": 0
        }

    avg_temp = sum(r.temperature for r in latest_readings) / len(latest_readings)
    avg_hum = sum(r.humidity for r in latest_readings) / len(latest_readings)
    doors_open = sum(1 for r in latest_readings if r.door_state)
    active_count = sum(1 for r in latest_readings if (datetime.now(timezone.utc) - r.time).total_seconds() < 600)

    return {
        "avgTemp": round(float(avg_temp), 1),
        "avgHumidity": round(float(avg_hum), 1),
        "activeChambers": active_count,
        "totalChambers": len(devices),
        "activeAlerts": 0,
        "doorsOpen": doors_open
    }


@router.get("/history/temperature")
async def get_temperature_history(
    db: AsyncSession = Depends(get_db)
):
    """Compatibility endpoint for dashboard 'Temperature Trends' showing LATEST data."""
    # Fetch latest 24 readings sorted by time
    result = await db.execute(
        select(SensorReading)
        .order_by(SensorReading.time.desc())
        .limit(24)
    )
    readings = list(result.scalars().all())
    readings.reverse() # Show in chronological order for the chart
    
    return [
        {
            "time": r.time.strftime("%H:%M"),
            "a1": r.temperature,
            "a2": r.temperature + 0.2 if r.temperature else None,
            "b1": r.temperature - 0.2 if r.temperature else None
        }
        for r in readings
    ]

@router.get("/history/humidity")
async def get_humidity_history(
    db: AsyncSession = Depends(get_db)
):
    """Compatibility endpoint for dashboard 'Humidity Trends'."""
    result = await db.execute(
        select(SensorReading)
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
async def get_zone_distribution():
    """Compatibility endpoint for dashboard 'Humidity Distribution across Zones'."""
    # Placeholder to satisfy UI until zone mapping is implemented
    return [
        {"name": "Zone A1", "value": 45},
        {"name": "Zone A2", "value": 32},
        {"name": "Zone B1", "value": 23}
    ]
