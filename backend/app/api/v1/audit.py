"""Audit Log API — read-only."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter()


@router.get("/")
async def list_audit_logs(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_AUDIT_LOGS)),
):
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.organization_id == org_id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "user_id": str(log.user_id) if log.user_id else None,
            "ip_address": log.ip_address,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
