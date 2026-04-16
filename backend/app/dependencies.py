"""FastAPI dependencies — auth resolution and DB session."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import verify_access_token
from app.db.session import get_db
from app.models.user import User

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(_bearer)],
    access_token: Annotated[str | None, Cookie()] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Resolves authenticated user from:
    1. Authorization: Bearer <token> header (API clients / Android)
    2. access_token HttpOnly cookie (Web PWA)
    Raises 401 if neither is present or token is invalid.
    """
    token: str | None = None
    if credentials:
        token = credentials.credentials
    elif access_token:
        token = access_token

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_error

    try:
        payload = verify_access_token(token)
    except JWTError:
        raise credentials_error

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise credentials_error

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise credentials_error

    return user


async def get_current_org_id(current_user: User = Depends(get_current_user)) -> uuid.UUID:
    """Extract organization_id from authenticated user — used for row-level isolation."""
    return current_user.organization_id
