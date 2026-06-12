"""Dispatch model."""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Dispatch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "dispatch"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    vehicle: Mapped[str] = mapped_column(String(50), nullable=False)
    reefer: Mapped[str] = mapped_column(String(20), nullable=False, default="-18C")
    driver: Mapped[str] = mapped_column(String(100), nullable=False)
    dest: Mapped[str] = mapped_column(String(255), nullable=False)
    load: Mapped[str | None] = mapped_column(String(100))
    eta: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Scheduled")
