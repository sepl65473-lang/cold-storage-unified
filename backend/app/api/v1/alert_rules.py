"""Alert Rules CRUD API."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id
from app.models.alert_rule import AlertRule
from app.models.user import User
from app.schemas.operations import AlertRuleCreate, AlertRuleUpdate

router = APIRouter()


def _to_response(r: AlertRule) -> dict:
    return {
        "id": str(r.id),
        "name": r.name,
        "metric": r.metric,
        "operator": r.operator,
        "threshold": r.threshold,
        "severity": r.severity,
        "is_active": r.is_active,
        "device_id": str(r.device_id) if r.device_id else None,
        "created_at": r.created_at.isoformat(),
    }


@router.get("/")
async def list_alert_rules(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
):
    result = await db.execute(select(AlertRule).where(AlertRule.organization_id == org_id))
    return [_to_response(r) for r in result.scalars().all()]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_alert_rule(
    payload: AlertRuleCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    rule = AlertRule(organization_id=org_id, **payload.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return _to_response(rule)


@router.put("/{rule_id}")
async def update_alert_rule(
    rule_id: uuid.UUID,
    payload: AlertRuleUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
):
    result = await db.execute(
        select(AlertRule).where(AlertRule.id == rule_id, AlertRule.organization_id == org_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(rule, k, v)
    await db.commit()
    await db.refresh(rule)
    return _to_response(rule)


@router.delete("/{rule_id}")
async def delete_alert_rule(
    rule_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.MANAGE_ORGANISATIONS)),
) -> Response:
    result = await db.execute(
        select(AlertRule).where(AlertRule.id == rule_id, AlertRule.organization_id == org_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    await db.delete(rule)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
