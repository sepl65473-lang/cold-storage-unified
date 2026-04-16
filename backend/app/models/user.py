"""Organization and User ORM models."""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.device import Device


class DataRegion(StrEnum):
    US = "us-east-1"
    EU = "eu-west-1"


class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Data residency region — determines which AWS region RDS is in for this org
    region: Mapped[str] = mapped_column(String(20), nullable=False, default=DataRegion.US)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    users: Mapped[list[User]] = relationship("User", back_populates="organization")
    devices: Mapped[list[Device]] = relationship("Device", back_populates="organization")


class UserRole(StrEnum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    # email_encrypted stores AES-256 encrypted PII; email is a hash for lookup
    email_encrypted: Mapped[str] = mapped_column(String(512), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), nullable=False, default=UserRole.VIEWER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # AES-256 encrypted TOTP secret
    mfa_secret_encrypted: Mapped[str | None] = mapped_column(String(512))
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    organization: Mapped[Organization] = relationship("Organization", back_populates="users")

    # SSO identity — Cognito sub claim (null for local-auth users)
    sso_sub: Mapped[str | None] = mapped_column(String(255), index=True)
