"""Notifications API."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id, get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.operations import NotificationCreate

router = APIRouter()


def _to_response(n: Notification) -> dict:
    return {
        "id": str(n.id),
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "read": n.is_read,
        "created_at": n.created_at.isoformat(),
    }


@router.get("/")
async def list_notifications(
    org_id: uuid.UUID = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(
            Notification.organization_id == org_id,
            (Notification.user_id == current_user.id) | (Notification.user_id == None),
        )
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    items = result.scalars().all()
    return {"notifications": [_to_response(n) for n in items]}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_notification(
    payload: NotificationCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_USERS)),
):
    n = Notification(organization_id=org_id, **payload.model_dump())
    db.add(n)
    await db.commit()
    await db.refresh(n)
    return _to_response(n)


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.organization_id == org_id)
        .values(is_read=True)
    )
    await db.commit()
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(
    org_id: uuid.UUID = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(
            Notification.organization_id == org_id,
            (Notification.user_id == current_user.id) | (Notification.user_id == None),
        )
        .values(is_read=True)
    )
    await db.commit()
    return {"ok": True}
