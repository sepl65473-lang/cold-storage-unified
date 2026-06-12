"""Dispatch CRUD API."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id
from app.models.dispatch import Dispatch
from app.models.user import User
from app.schemas.operations import DispatchCreate, DispatchUpdate

router = APIRouter()


def _to_response(d: Dispatch) -> dict:
    return {
        "id": str(d.id)[:8].upper(),
        "vehicle": d.vehicle,
        "reefer": d.reefer,
        "driver": d.driver,
        "dest": d.dest,
        "load": d.load or "-",
        "eta": d.eta or "-",
        "status": d.status,
        "_id": str(d.id),
    }


@router.get("/")
async def list_dispatch(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    result = await db.execute(select(Dispatch).where(Dispatch.organization_id == org_id))
    return [_to_response(d) for d in result.scalars().all()]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_dispatch(
    payload: DispatchCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    d = Dispatch(organization_id=org_id, **payload.model_dump())
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return _to_response(d)


@router.put("/{dispatch_id}")
async def update_dispatch(
    dispatch_id: uuid.UUID,
    payload: DispatchUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    result = await db.execute(
        select(Dispatch).where(Dispatch.id == dispatch_id, Dispatch.organization_id == org_id)
    )
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    await db.commit()
    await db.refresh(d)
    return _to_response(d)


@router.delete("/{dispatch_id}")
async def delete_dispatch(
    dispatch_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
) -> Response:
    result = await db.execute(
        select(Dispatch).where(Dispatch.id == dispatch_id, Dispatch.organization_id == org_id)
    )
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    await db.delete(d)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
