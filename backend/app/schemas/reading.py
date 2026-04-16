"""Pydantic schemas for Sensor Readings, Commands, and OTA."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


# ─── Readings ─────────────────────────────────────────────────────────────────

class SensorReadingResponse(BaseModel):
    time: datetime
    device_id: uuid.UUID
    temperature: float | None
    humidity: float | None
    battery_level: float | None
    solar_power_watts: float | None
    compressor_state: bool | None
    door_state: bool | None
    cooling_cycle_duration: int | None

    model_config = ConfigDict(from_attributes=True)


class SensorReadingIngest(BaseModel):
    device_id: uuid.UUID
    time: datetime | None = None  # Optional, server will use current time if not provided
    temperature: float | None = None
    humidity: float | None = None
    battery_level: float | None = None
    solar_power_watts: float | None = None
    compressor_state: bool | None = None
    door_state: bool | None = None
    cooling_cycle_duration: int | None = None


class SensorReadingAggregatedResponse(BaseModel):
    bucket: datetime
    device_id: uuid.UUID
    avg_temperature: float | None
    avg_humidity: float | None
    avg_battery_level: float | None
    avg_solar_power_watts: float | None
    sample_count: int

    model_config = ConfigDict(from_attributes=True)


# ─── Commands ─────────────────────────────────────────────────────────────────

class CommandCreate(BaseModel):
    type: str  # "toggle_cooling", "toggle_fan", "reboot"
    value: dict[str, Any] = {}


class CommandResponse(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    issued_by: uuid.UUID
    type: str
    value: dict[str, Any]
    status: str
    acknowledged_at: datetime | None
    mqtt_message_id: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── OTA ──────────────────────────────────────────────────────────────────────

class OtaReleaseCreate(BaseModel):
    version: str
    s3_key: str  # Path to binary in the firmware S3 bucket


class OtaAckPayload(BaseModel):
    status: str  # "success" or "failed"
