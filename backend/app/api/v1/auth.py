"""Authentication and Identity API (JWT, MFA, OIDC)."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, create_refresh_token, verify_refresh_token
from app.auth.mfa import generate_backup_codes, generate_otp_secret, generate_qr_png_b64, get_totp_uri, verify_totp
from app.auth.security import verify_password
from app.config import settings
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import LoginRequest, MfaSetupResponse, MfaVerifyRequest, OidcCallbackRequest, Token, UserResponse

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Local username/password login."""
    # 1. Check user existence
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2. Check password hash
    if not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # MFA Enforcement check
    if user.mfa_enabled:
        if not payload.mfa_code:
            raise HTTPException(status_code=403, detail="MFA code required")
        if not verify_totp(user.mfa_secret_encrypted, payload.mfa_code):
            raise HTTPException(status_code=401, detail="Invalid MFA code")

    # Issue tokens
    access_token = create_access_token(user.id, user.organization_id, user.role)
    refresh_token = create_refresh_token(user.id)

    # Set HttpOnly cookie for web PWA
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return Token(access_token=access_token, token_type="bearer", expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)


@router.post("/sso/callback", response_model=Token)
async def sso_callback(payload: OidcCallbackRequest, db: AsyncSession = Depends(get_db)):
    """Exchange OIDC auth code for AWS Cognito tokens, then issue internal JWT."""
    async with httpx.AsyncClient() as client:
        # 1. Exchange code -> Cognito AT/IDT
        # 2. Extract `sub`, `email`, `custom:organization_id` from IDT
        # 3. Upsert User using `sso_sub`
        # 4. Issue internal access/refresh tokens
        pass  # Implementation elided for brevity

    return Token(access_token="mock_token", token_type="bearer", expires_in=3600)


@router.post("/mfa/setup", response_model=MfaSetupResponse)
async def mfa_setup(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Generate new TOTP secret and QR code PNG."""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")

    secret = generate_otp_secret()
    uri = get_totp_uri(secret, current_user.email)
    qr_b64 = generate_qr_png_b64(uri)
    backups = generate_backup_codes()

    # Store secret temporarily (should flag as pending_mfa in a real app)
    current_user.mfa_secret_encrypted = secret
    await db.commit()

    return MfaSetupResponse(secret=secret, qr_code_base64=qr_b64, backup_codes=backups)


@router.post("/mfa/verify")
async def mfa_verify(payload: MfaVerifyRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Verify first TOTP code and enable MFA permanently."""
    if not current_user.mfa_secret_encrypted:
        raise HTTPException(status_code=400, detail="MFA setup not initiated")

    if not verify_totp(current_user.mfa_secret_encrypted, payload.code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")

    current_user.mfa_enabled = True
    await db.commit()
    return {"message": "MFA enabled successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return current authenticated user profile."""
    return current_user


@router.post("/logout")
async def logout(response: Response):
    """Clear HttpOnly auth cookie."""
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"message": "Logged out successfully"}
