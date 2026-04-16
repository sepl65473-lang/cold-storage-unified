"""Alert management API."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id, get_current_user
from app.models.alert import Alert
from app.models.user import User
from app.schemas.device import AlertResolveRequest, AlertResponse

router = APIRouter()

@router.post("/test", status_code=201)
async def trigger_test_alert(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.ACKNOWLEDGE_ALERTS)),
):
    """Trigger a mock alert to test the notification pipeline."""
    from app.workers.notification_dispatcher import dispatch_alert_notification
    from app.models.alert import AlertSeverity
    import random

    # 1. Create a real alert record
    alert = Alert(
        id=uuid.uuid4(),
        organization_id=org_id,
        device_id=None,  # System alert
        type="system_test",
        severity=AlertSeverity.WARNING,
        message=f"Manual System Test #{random.randint(100, 999)} success!",
        is_resolved=False
    )
    db.add(alert)
    await db.commit()

    # 2. Dispatch notification (worker task)
    dispatch_alert_notification.delay(str(alert.id))
    
    return {"status": "success", "alert_id": str(alert.id), "message": "Test alert created and dispatched."}


@router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    unresolved_only: bool = Query(True),
    limit: int = Query(100),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> Sequence[Alert]:
    query = select(Alert).where(Alert.organization_id == org_id)
    if unresolved_only:
        query = query.where(Alert.is_resolved == False)

    query = query.order_by(Alert.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: uuid.UUID,
    payload: AlertResolveRequest,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.ACKNOWLEDGE_ALERTS)),
) -> Alert:
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.organization_id == org_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if payload.resolved and not alert.is_resolved:
        alert.is_resolved = True
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolved_by = user.id

        await db.commit()
        await db.refresh(alert)

    return alert
