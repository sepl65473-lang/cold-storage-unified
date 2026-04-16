"""Admin API for User Management."""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id, get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
async def list_users(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission(Permission.MANAGE_USERS)),
) -> Sequence[User]:
    """List all users in the organization."""
    result = await db.execute(select(User).where(User.organization_id == org_id))
    return result.scalars().all()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission(Permission.MANAGE_USERS)),
) -> User:
    """Provision a new user for the organization."""
    if payload.organization_id != org_id and admin.role != "superadmin":
        raise HTTPException(status_code=403, detail="Cannot provision users for other organizations")

    # Check if email is available (in real app, hash email for lookup)
    result = await db.execute(select(User.id).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        organization_id=payload.organization_id,
        email=payload.email,
        email_encrypted="[ENCRYPTED_PLACEHOLDER]",  # Would use AES-256 here
        role=payload.role,
        is_active=True,
    )
    if payload.password:
        new_user.password_hash = "[BCRYPT_HASH_PLACEHOLDER]"

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user



@router.delete("/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission(Permission.MANAGE_USERS)),
) -> Response:
    result = await db.execute(select(User).where(User.id == user_id, User.organization_id == org_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user.is_active = False
    # GDPR anonymization
    user.email = f"deleted_{uuid.uuid4().hex[:8]}@anonymized.local"
    user.email_encrypted = ""
    user.password_hash = None
    user.mfa_secret_encrypted = None
    user.mfa_enabled = False
    user.sso_sub = None

    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
