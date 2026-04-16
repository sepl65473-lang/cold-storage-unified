"""Device Management API — scoped to current user's organization."""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id, get_current_user
from app.models.device import Device
from app.models.user import User
from app.schemas.device import DeviceCreate, DeviceResponse, DeviceUpdate

router = APIRouter()


@router.get("/", response_model=list[DeviceResponse])
async def list_devices(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> Sequence[Device]:
    result = await db.execute(select(Device).where(Device.organization_id == org_id))
    return result.scalars().all()


@router.post("/", response_model=DeviceResponse)
async def create_device(
    payload: DeviceCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    # Only Admins can register new devices for the org
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
) -> Device:
    new_device = Device(
        organization_id=org_id,
        name=payload.name,
        location_lat=payload.location_lat,
        location_lng=payload.location_lng,
        location_label=payload.location_label,
        # thing_name uniquely identifies device in AWS IoT Core namespaces
        thing_name=f"{org_id}_{uuid.uuid4().hex[:8]}",
    )
    db.add(new_device)
    await db.commit()
    await db.refresh(new_device)
    return new_device


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> Device:
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.organization_id == org_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.get("/{device_id}/telemetry")
async def get_device_telemetry_alias(
    device_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    """
    Alias for /readings/{device_id}/raw or similar, 
    used by some versions of the frontend.
    """
    from app.api.v1.readings import get_raw_readings
    return await get_raw_readings(device_id=device_id, org_id=org_id, db=db, user=user)


@router.patch("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: uuid.UUID,
    payload: DeviceUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
) -> Device:
    device = await get_device(device_id, org_id, db, user)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(device, key, value)

    await db.commit()
    await db.refresh(device)
    return device
