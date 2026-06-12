"""Produce (Fruits & Vegetables) model."""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Produce(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "produce"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False, default="Fruit")
    variety: Mapped[str] = mapped_column(String(100), nullable=False)
    chamber: Mapped[str] = mapped_column(String(50), nullable=False)
    temp_required: Mapped[str] = mapped_column(String(30), nullable=False)
    pallets: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    weight: Mapped[str | None] = mapped_column(String(30))
    origin: Mapped[str] = mapped_column(String(100), nullable=False)
    expiry: Mapped[str] = mapped_column(String(50), nullable=False)
    quality: Mapped[str] = mapped_column(String(30), nullable=False, default="Fresh")
    current_temp: Mapped[float | None] = mapped_column(Float)
