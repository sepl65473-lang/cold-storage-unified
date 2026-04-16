"""Admin API for Firmware OTA Releases."""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, status
from sqlalchemy import select

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id, get_current_user
from app.models.device import Device
from app.models.user import User
from app.models.ota import FirmwareRelease, OTAUpdate
from app.schemas.ota import FirmwareReleaseCreate, FirmwareReleaseResponse, OTAUpdateResponse

router = APIRouter()


@router.post("/releases", status_code=status.HTTP_201_CREATED, response_model=FirmwareReleaseResponse)
async def create_release(
    payload: FirmwareReleaseCreate,
    db=Depends(get_db),
    org_id: uuid.UUID = Depends(get_current_org_id),
    admin: User = Depends(require_permission(Permission.PUSH_OTA)),
) -> FirmwareRelease:
    """
    1. Create a records of the new firmware release.
    2. Register OTA update attempts for all devices in the organization.
    3. Offload the actual MQTT broadcast to Celery.
    """
    # 1. Create FirmwareRelease
    release = FirmwareRelease(
        organization_id=org_id,
        version=payload.version,
        s3_key=payload.s3_key,
        sha256_hash=payload.sha256_hash,
        description=payload.description,
        created_by=admin.id,
    )
    db.add(release)
    await db.flush() # Get the release ID

    # 2. Get all devices for this org
    result = await db.execute(select(Device).where(Device.organization_id == org_id))
    devices = result.scalars().all()

    # 3. Create OTAUpdate (pending) for each device
    for device in devices:
        ota_update = OTAUpdate(
            device_id=device.id,
            release_id=release.id,
            status="pending",
            progress=0
        )
        db.add(ota_update)

    await db.commit()
    await db.refresh(release)

    # 4. Dispatch to Celery worker for MQTT broadcast
    from app.workers.ota_publisher import publish_ota_release
    publish_ota_release.apply_async(
        args=[str(org_id), payload.version, payload.s3_key],
        queue="default",
    )

    return release


@router.get("/releases", response_model=Sequence[FirmwareReleaseResponse])
async def list_releases(
    db=Depends(get_db),
    org_id: uuid.UUID = Depends(get_current_org_id),
    _: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> Sequence[FirmwareRelease]:
    """List all firmware releases for the organization."""
    result = await db.execute(
        select(FirmwareRelease)
        .where(FirmwareRelease.organization_id == org_id)
        .order_by(FirmwareRelease.created_at.desc())
    )
    return result.scalars().all()


@router.get("/updates", response_model=Sequence[OTAUpdateResponse])
async def list_ota_updates(
    db=Depends(get_db),
    org_id: uuid.UUID = Depends(get_current_org_id),
    _: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> Sequence[OTAUpdate]:
    """List all OTA update attempts in the organization."""
    # Joins with devices to only get updates for devices in this org
    result = await db.execute(
        select(OTAUpdate)
        .join(Device)
        .where(Device.organization_id == org_id)
        .order_by(OTAUpdate.created_at.desc())
    )
    return result.scalars().all()
