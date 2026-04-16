"""SensorReading — TimescaleDB hypertable model.

NOTE: This table is NOT created via standard CREATE TABLE.
Alembic creates the base table, then converts it to a TimescaleDB hypertable
via `SELECT create_hypertable(...)` in the same migration.
SQLAlchemy is used only for query-layer operations.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SensorReading(Base):
    """
    TimescaleDB hypertable — partitioned by `time`, 1-week chunks.
    No surrogate PK; composite (time, device_id) is the natural key.
    """
    __tablename__ = "sensor_readings"

    time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        primary_key=True,
        nullable=False,
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id"),
        primary_key=True,
        nullable=False,
        index=True,
    )

    # Environmental sensors
    temperature: Mapped[float | None] = mapped_column(Float(precision=4))     # °C
    humidity: Mapped[float | None] = mapped_column(Float(precision=4))        # %RH

    # Power metrics
    battery_level: Mapped[float | None] = mapped_column(Float(precision=4))  # %
    solar_power_watts: Mapped[float | None] = mapped_column(Float(precision=4))

    # Operational state
    compressor_state: Mapped[bool | None] = mapped_column(Boolean)  # True = ON
    door_state: Mapped[bool | None] = mapped_column(Boolean)        # True = OPEN
    cooling_cycle_duration: Mapped[int | None] = mapped_column(Integer)  # seconds
