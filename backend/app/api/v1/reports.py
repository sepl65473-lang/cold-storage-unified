from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.device import Device
from app.models.sensor_reading import SensorReading

router = APIRouter()

@router.get("/")
async def list_available_reports() -> list[dict[str, Any]]:
    """Return a list of downloadable reports (metadata)."""
    # In a real system, these might be tracked in a 'reports' table.
    # For now, we provide the metadata expected by the UI.
    return [
        { "id": "weekly-temp", "title": "Weekly Temperature Summary", "type": "CSV", "date": datetime.now().strftime("%b %d, %Y"), "size": "Dynamic", "status": "Ready" },
        { "id": "monthly-hum", "title": "Monthly Humidity Analysis", "type": "CSV", "date": datetime.now().strftime("%b %d, %Y"), "size": "Dynamic", "status": "Ready" },
        { "id": "door-incidents", "title": "Door Access Incident Log", "type": "CSV", "date": datetime.now().strftime("%b %d, %Y"), "size": "Dynamic", "status": "Ready" },
    ]

@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Generate and stream a CSV report based on the report_id."""
    
    # 1. Fetch data based on report type
    if report_id == "weekly-temp" or report_id == "monthly-hum":
        days = 7 if "weekly" in report_id else 30
        start_time = datetime.now(timezone.utc) - timedelta(days=days)
        
        result = await db.execute(
            select(SensorReading, Device.name)
            .join(Device, SensorReading.device_id == Device.id)
            .where(SensorReading.time >= start_time)
            .order_by(SensorReading.time.desc())
            .limit(10000)
        )
        data = result.all()
    else:
        # Default empty or incident data
        data = []

    # 2. Generate CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow(["Timestamp", "Device Name", "Temperature (°C)", "Humidity (%)", "Solar (W)", "Compressor", "Door"])
    
    for row in data:
        r, device_name = row
        writer.writerow([
            r.time.strftime("%Y-%m-%d %H:%M:%S"),
            device_name,
            r.temperature,
            r.humidity,
            r.solar_power_watts,
            "ON" if r.compressor_state else "OFF",
            "OPEN" if r.door_state else "CLOSED"
        ])

    output.seek(0)
    
    filename = f"{report_id}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
