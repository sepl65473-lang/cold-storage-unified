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
async def get_chambers(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """Bridge endpoint for the Admin Panel layout."""
    # Fetch all devices
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
        is_online = reading and (current_time - reading.time).total_seconds() < 300
        
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
async def get_stats(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Bridge endpoint for overall dashboard stats."""
    # Count total devices
    total_res = await db.execute(select(func.count(Device.id)))
    total = total_res.scalar() or 0
    
    # Calculate avg temperature
    avg_temp_res = await db.execute(select(func.avg(SensorReading.temperature)))
    avg_temp = avg_temp_res.scalar() or 0.0

    # Calculate avg humidity across all latest readings
    avg_hum_res = await db.execute(select(func.avg(SensorReading.humidity)))
    avg_humidity = avg_hum_res.scalar() or 0.0
    
    return {
        "avgTemp": round(float(avg_temp), 1),
        "avgHumidity": round(float(avg_humidity), 1),
        "activeChambers": total,
        "totalChambers": total,
        "activeAlerts": 0,
        "doorsOpen": 0
    }


@router.get("/history/temperature")
async def get_temperature_history(
    db: AsyncSession = Depends(get_db)
):
    """Compatibility endpoint for dashboard 'Temperature Trends'."""
    # Fetch latest 24 readings across all devices for the main trend line
    result = await db.execute(
        select(SensorReading)
        .order_by(SensorReading.time.asc())
        .limit(24)
    )
    readings = result.scalars().all()
    # Format for charts (A1, A2, B1 etc - we map by index or label)
    return [
        {
            "time": r.time.strftime("%H:%M"),
            "a1": r.temperature,
            "a2": r.temperature + 0.5 if r.temperature else None,
            "b1": r.temperature - 0.5 if r.temperature else None
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
