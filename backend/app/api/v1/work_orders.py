"""Work Orders CRUD API."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id
from app.models.work_order import WorkOrder
from app.models.user import User
from app.schemas.operations import WorkOrderCreate, WorkOrderUpdate

router = APIRouter()


def _to_response(wo: WorkOrder) -> dict:
    return {
        "id": str(wo.id)[:8].upper(),
        "title": wo.title,
        "asset": wo.asset,
        "priority": wo.priority,
        "status": wo.status,
        "assignee": wo.assignee or "-",
        "due": wo.due or "-",
        "sla": wo.sla,
        "_id": str(wo.id),
    }


@router.get("/")
async def list_work_orders(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    result = await db.execute(select(WorkOrder).where(WorkOrder.organization_id == org_id))
    return [_to_response(wo) for wo in result.scalars().all()]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_work_order(
    payload: WorkOrderCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    wo = WorkOrder(organization_id=org_id, **payload.model_dump())
    db.add(wo)
    await db.commit()
    await db.refresh(wo)
    return _to_response(wo)


@router.put("/{wo_id}")
async def update_work_order(
    wo_id: uuid.UUID,
    payload: WorkOrderUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    result = await db.execute(
        select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.organization_id == org_id)
    )
    wo = result.scalar_one_or_none()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(wo, k, v)
    await db.commit()
    await db.refresh(wo)
    return _to_response(wo)


@router.delete("/{wo_id}")
async def delete_work_order(
    wo_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
) -> Response:
    result = await db.execute(
        select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.organization_id == org_id)
    )
    wo = result.scalar_one_or_none()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    await db.delete(wo)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
