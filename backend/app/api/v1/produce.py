"""Produce (Fruits & Vegetables) CRUD API."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id
from app.models.produce import Produce
from app.models.user import User
from app.schemas.operations import ProduceCreate, ProduceUpdate

router = APIRouter()


def _to_response(p: Produce) -> dict:
    return {
        "id": str(p.id)[:8].upper(),
        "name": p.name,
        "category": p.category,
        "variety": p.variety,
        "chamber": p.chamber,
        "tempRequired": p.temp_required,
        "currentTemp": p.current_temp,
        "pallets": p.pallets,
        "weight": p.weight or f"{p.pallets * 150} kg",
        "origin": p.origin,
        "expiry": p.expiry,
        "quality": p.quality,
        "_id": str(p.id),
    }


@router.get("/")
async def list_produce(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    result = await db.execute(select(Produce).where(Produce.organization_id == org_id))
    return [_to_response(p) for p in result.scalars().all()]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_produce(
    payload: ProduceCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    p = Produce(organization_id=org_id, **payload.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return _to_response(p)


@router.put("/{produce_id}")
async def update_produce(
    produce_id: uuid.UUID,
    payload: ProduceUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    result = await db.execute(
        select(Produce).where(Produce.id == produce_id, Produce.organization_id == org_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Produce not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return _to_response(p)


@router.delete("/{produce_id}")
async def delete_produce(
    produce_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
) -> Response:
    result = await db.execute(
        select(Produce).where(Produce.id == produce_id, Produce.organization_id == org_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Produce not found")
    await db.delete(p)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
