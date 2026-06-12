"""Gateway model."""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Gateway(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "gateways"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    facility_id: Mapped[str] = mapped_column(String(100), nullable=False, default="SEPL-NORTH")
    ip: Mapped[str | None] = mapped_column(String(45))
    fw: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Online")
    uptime: Mapped[str | None] = mapped_column(String(20))
    device_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_sync: Mapped[str | None] = mapped_column(String(50))
