from __future__ import annotations

import uuid
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
        
        chambers.append({
            "id": str(dev.id),
            "name": dev.name,
            "temp": reading.temperature if reading else 0.0,
            "humidity": reading.humidity if reading else 0.0,
            "status": "online" if reading and reading.time > (func.now() - func.interval('5 minutes')) else "offline",
            "doorStatus": "open" if reading and reading.door_state else "closed"
        })
    return chambers

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Bridge endpoint for overall dashboard stats."""
    # Count total devices
    total_res = await db.execute(select(func.count(Device.id)))
    total = total_res.scalar() or 0
    
    # Calculate avg temp across all latest readings
    avg_res = await db.execute(select(func.avg(SensorReading.temperature)))
    avg_temp = avg_res.scalar() or 0.0
    
    return {
        "avgTemp": round(float(avg_temp), 1),
        "avgHumidity": 65, # Placeholder or calculated
        "activeChambers": total,
        "totalChambers": total,
        "activeAlerts": 0,
        "doorsOpen": 0
    }

@router.get("/alerts")
async def get_alerts() -> list[dict[str, Any]]:
    """Bridge endpoint for dashboard alerts."""
    return [] # Return empty list for now to satisfy UI
