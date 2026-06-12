"""Roles API — returns available roles and permission matrix."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.auth.rbac import Permission, require_permission, _ROLE_PERMISSIONS
from app.models.user import User, UserRole

router = APIRouter()

ALL_PERMS = [
    "dashboard", "produce", "chambers", "devices", "gateways", "alerts",
    "notifications", "work_orders", "dispatch", "inventory", "reports",
    "audit", "users", "roles", "settings",
]

ROLE_DISPLAY = {
    UserRole.SUPERADMIN: "Super Admin",
    UserRole.ADMIN: "Admin",
    UserRole.OPERATOR: "Operator",
    UserRole.VIEWER: "Viewer",
}


@router.get("/")
async def list_roles(
    user: User = Depends(require_permission(Permission.MANAGE_USERS)),
):
    roles = [
        {"id": role.value, "name": ROLE_DISPLAY.get(role, role.value), "value": role.value}
        for role in UserRole
    ]
    # Build permission matrix: role → list of frontend permission strings
    matrix = {}
    for role in UserRole:
        backend_perms = _ROLE_PERMISSIONS.get(role, set())
        # Map backend Permission enum values to frontend permission names
        has_all = Permission.MANAGE_ORGANISATIONS in backend_perms
        matrix[role.value] = ALL_PERMS if has_all else [
            p for p in ALL_PERMS
            if p in ("dashboard", "produce", "chambers", "devices", "alerts", "notifications")
        ]

    return {"roles": roles, "perms": ALL_PERMS, "matrix": matrix}
