"""OTA and Firmware ORM models."""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.device import Device
    from app.models.user import User, Organization


class OTAUpdateStatus(StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class FirmwareRelease(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "firmware_releases"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    organization: Mapped[Organization] = relationship("Organization")
    author: Mapped[User] = relationship("User")
    updates: Mapped[list[OTAUpdate]] = relationship("OTAUpdate", back_populates="release")


class OTAUpdate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ota_updates"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False, index=True
    )
    release_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("firmware_releases.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=OTAUpdateStatus.PENDING)
    progress: Mapped[int] = mapped_column(default=0)  # 0-100%
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    # Metadata for custom properties like "forced_update"
    meta_data: Mapped[dict | None] = mapped_column(JSONB)

    # Relationships
    device: Mapped[Device] = relationship("Device")
    release: Mapped[FirmwareRelease] = relationship("FirmwareRelease", back_populates="updates")
