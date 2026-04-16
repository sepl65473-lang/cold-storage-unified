"""JWT creation and validation (RS256)."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.config import settings

_ALGORITHM = settings.JWT_ALGORITHM
# Use SECRET_KEY for HS256, or explicit keys for RS256
_SIGNING_KEY = settings.SECRET_KEY if _ALGORITHM == "HS256" else settings.JWT_PRIVATE_KEY
_VERIFYING_KEY = settings.SECRET_KEY if _ALGORITHM == "HS256" else settings.JWT_PUBLIC_KEY


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    subject: str | uuid.UUID,
    organization_id: str | uuid.UUID,
    role: str,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    expire = _now_utc() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "org": str(organization_id),
        "role": role,
        "iat": int(_now_utc().timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, _SIGNING_KEY, algorithm=_ALGORITHM)


def create_refresh_token(subject: str | uuid.UUID) -> str:
    expire = _now_utc() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(subject),
        "iat": int(_now_utc().timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh",
    }
    return jwt.encode(payload, _SIGNING_KEY, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises JWTError on invalid/expired tokens."""
    return jwt.decode(token, _VERIFYING_KEY, algorithms=[_ALGORITHM])


def verify_access_token(token: str) -> dict[str, Any]:
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise JWTError("Token type mismatch — expected access token")
    return payload


def verify_refresh_token(token: str) -> str:
    """Returns the subject (user_id) from a valid refresh token."""
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise JWTError("Token type mismatch — expected refresh token")
    return payload["sub"]
