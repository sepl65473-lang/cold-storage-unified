"""Inventory CRUD API."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.operations import InventoryCreate, InventoryUpdate

router = APIRouter()


def _to_response(item: Inventory) -> dict:
    return {
        "id": str(item.id)[:8].upper(),
        "product": item.product,
        "category": item.category,
        "chamber": item.chamber,
        "pallets": item.pallets,
        "weight": item.weight or f"{item.pallets * 25} kg",
        "received": item.received or item.created_at.strftime("%b %d, %Y"),
        "expiry": item.expiry or "-",
        "status": item.status,
        "_id": str(item.id),
    }


@router.get("/")
async def list_inventory(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    result = await db.execute(select(Inventory).where(Inventory.organization_id == org_id))
    return [_to_response(item) for item in result.scalars().all()]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_inventory(
    payload: InventoryCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    item = Inventory(
        organization_id=org_id,
        received=datetime.now().strftime("%b %d, %Y"),
        **payload.model_dump(),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _to_response(item)


@router.put("/{item_id}")
async def update_inventory(
    item_id: uuid.UUID,
    payload: InventoryUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    result = await db.execute(
        select(Inventory).where(Inventory.id == item_id, Inventory.organization_id == org_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    await db.commit()
    await db.refresh(item)
    return _to_response(item)


@router.delete("/{item_id}")
async def delete_inventory(
    item_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
) -> Response:
    result = await db.execute(
        select(Inventory).where(Inventory.id == item_id, Inventory.organization_id == org_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
