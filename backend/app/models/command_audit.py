"""DeviceCommand and AuditLog ORM models."""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


# ─── Device Commands ──────────────────────────────────────────────────────────

class CommandType(StrEnum):
    TOGGLE_COOLING = "toggle_cooling"
    TOGGLE_FAN = "toggle_fan"
    REBOOT = "reboot"
    REQUEST_READING = "request_reading"


class CommandStatus(StrEnum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    FAILED = "failed"
    EXPIRED = "expired"


class DeviceCommand(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "device_commands"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False, index=True
    )
    issued_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    # e.g. {"state": true} for toggle_cooling — validated by Pydantic schema
    value: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=CommandStatus.PENDING)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mqtt_message_id: Mapped[str | None] = mapped_column(String(255))



# ─── Audit Log (Moved to audit_log.py) ─────────────────────────────────────────
