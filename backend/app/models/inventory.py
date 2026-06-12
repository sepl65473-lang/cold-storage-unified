"""Inventory model."""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Inventory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "inventory"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    product: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    chamber: Mapped[str] = mapped_column(String(50), nullable=False)
    pallets: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    weight: Mapped[str | None] = mapped_column(String(30))
    received: Mapped[str | None] = mapped_column(String(50))
    expiry: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="In Stock")
