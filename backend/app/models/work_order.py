"""Work Order model."""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class WorkOrder(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "work_orders"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    asset: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="Medium")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Open")
    assignee: Mapped[str | None] = mapped_column(String(100))
    due: Mapped[str | None] = mapped_column(String(50))
    sla: Mapped[str] = mapped_column(String(20), nullable=False, default="On Track")
