"""Gateways CRUD API."""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id
from app.models.gateway import Gateway
from app.models.user import User
from app.schemas.operations import GatewayCreate, GatewayResponse, GatewayUpdate

router = APIRouter()


def _to_response(gw: Gateway) -> dict:
    return {
        "id": str(gw.id),
        "name": gw.name,
        "facility_id": gw.facility_id,
        "facility": gw.facility_id,
        "ip": gw.ip or "-",
        "fw": gw.fw or "-",
        "status": gw.status,
        "uptime": gw.uptime or "100%",
        "devices": str(gw.device_count),
        "lastSync": gw.last_sync or "-",
        "organization_id": str(gw.organization_id),
        "created_at": gw.created_at.isoformat(),
    }


@router.get("/")
async def list_gateways(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    result = await db.execute(select(Gateway).where(Gateway.organization_id == org_id))
    return [_to_response(gw) for gw in result.scalars().all()]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_gateway(
    payload: GatewayCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    gw = Gateway(organization_id=org_id, **payload.model_dump())
    db.add(gw)
    await db.commit()
    await db.refresh(gw)
    return _to_response(gw)


@router.put("/{gateway_id}")
async def update_gateway(
    gateway_id: uuid.UUID,
    payload: GatewayUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    result = await db.execute(
        select(Gateway).where(Gateway.id == gateway_id, Gateway.organization_id == org_id)
    )
    gw = result.scalar_one_or_none()
    if not gw:
        raise HTTPException(status_code=404, detail="Gateway not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(gw, k, v)
    await db.commit()
    await db.refresh(gw)
    return _to_response(gw)


@router.delete("/{gateway_id}")
async def delete_gateway(
    gateway_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
) -> Response:
    result = await db.execute(
        select(Gateway).where(Gateway.id == gateway_id, Gateway.organization_id == org_id)
    )
    gw = result.scalar_one_or_none()
    if not gw:
        raise HTTPException(status_code=404, detail="Gateway not found")
    await db.delete(gw)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
