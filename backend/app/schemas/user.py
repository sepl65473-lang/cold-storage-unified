"""Pydantic schemas for User and Auth."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    role: str
    is_active: bool
    mfa_enabled: bool


class UserCreate(BaseModel):
    email: EmailStr
    role: str
    password: str | None = None  # None if SSO
    organization_id: uuid.UUID


class UserResponse(UserBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    last_login: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: str | None = None


class OidcCallbackRequest(BaseModel):
    code: str
    redirect_uri: str


class MfaSetupResponse(BaseModel):
    secret: str
    qr_code_base64: str
    backup_codes: list[str]


class MfaVerifyRequest(BaseModel):
    secret: str
    code: str
