"""RBAC — Role-Based Access Control.

FastAPI dependency factories for role enforcement.
Each function returns a Depends()-compatible callable.
"""
from __future__ import annotations

from enum import StrEnum
from functools import lru_cache
from typing import Callable

from fastapi import Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models.user import UserRole


class Permission(StrEnum):
    MANAGE_ORGANISATIONS = "manage_organisations"
    MANAGE_USERS = "manage_users"
    VIEW_DEVICES = "view_devices"
    SEND_COMMANDS = "send_commands"
    ACKNOWLEDGE_ALERTS = "acknowledge_alerts"
    PUSH_OTA = "push_ota"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    EXPORT_DATA = "export_data"


# Role → permission set mapping
_ROLE_PERMISSIONS: dict[str, set[Permission]] = {
    UserRole.SUPERADMIN: set(Permission),  # all permissions
    UserRole.ADMIN: {
        Permission.MANAGE_USERS,
        Permission.VIEW_DEVICES,
        Permission.SEND_COMMANDS,
        Permission.ACKNOWLEDGE_ALERTS,
        Permission.PUSH_OTA,
        Permission.VIEW_AUDIT_LOGS,
        Permission.EXPORT_DATA,
    },
    UserRole.OPERATOR: {
        Permission.VIEW_DEVICES,
        Permission.SEND_COMMANDS,
        Permission.ACKNOWLEDGE_ALERTS,
    },
    UserRole.VIEWER: {
        Permission.VIEW_DEVICES,
    },
}


def has_permission(role: str, permission: Permission) -> bool:
    return permission in _ROLE_PERMISSIONS.get(role, set())


def require_roles(*roles: UserRole) -> Callable:
    """FastAPI dependency — raises 403 if current user's role is not in allowed set."""
    async def dependency(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not authorized for this action.",
            )
        return current_user

    return dependency


def require_permission(permission: Permission) -> Callable:
    """Finer-grained permission check dependency."""
    async def dependency(current_user=Depends(get_current_user)):
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required.",
            )
        return current_user

    return dependency


# ── Pre-built common dependencies ─────────────────────────────────────────────
require_admin = require_roles(UserRole.SUPERADMIN, UserRole.ADMIN)
require_operator = require_roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.OPERATOR)
require_superadmin = require_roles(UserRole.SUPERADMIN)
