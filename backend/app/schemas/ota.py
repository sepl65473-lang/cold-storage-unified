"""Pydantic schemas for OTA Firmware releases and updates."""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class FirmwareReleaseBase(BaseModel):
    version: str
    s3_key: str
    description: Optional[str] = None

class FirmwareReleaseCreate(FirmwareReleaseBase):
    sha256_hash: str

class FirmwareReleaseResponse(FirmwareReleaseBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    sha256_hash: str
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class OTAUpdateResponse(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    release_id: uuid.UUID
    status: str
    progress: int
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
