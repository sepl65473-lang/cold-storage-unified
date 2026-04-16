"""MFA (TOTP) service."""
from __future__ import annotations

import base64
import secrets
from io import BytesIO

import pyotp
import qrcode

from app.config import settings


_ISSUER = "ColdStoragePlatform"
_BACKUP_CODE_COUNT = 8
_BACKUP_CODE_LENGTH = 10


def generate_otp_secret() -> str:
    """Generate a new base32 TOTP secret."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=_ISSUER)


def generate_qr_png_b64(uri: str) -> str:
    """Return QR code as a base64-encoded PNG string for the setup response."""
    img = qrcode.make(uri)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def verify_totp(secret: str, code: str, valid_window: int = 1) -> bool:
    """Verify a TOTP code. valid_window=1 allows ±30 seconds clock skew."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=valid_window)


def generate_backup_codes() -> list[str]:
    """Generate one-time backup codes (plain text — caller must hash before storing)."""
    return [
        secrets.token_hex(_BACKUP_CODE_LENGTH // 2).upper()
        for _ in range(_BACKUP_CODE_COUNT)
    ]
