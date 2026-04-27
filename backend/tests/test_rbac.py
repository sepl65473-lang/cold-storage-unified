from app.auth.rbac import Permission, has_permission
from app.models.user import UserRole


def test_viewer_is_read_only():
    assert has_permission(UserRole.VIEWER, Permission.VIEW_DEVICES)
    assert not has_permission(UserRole.VIEWER, Permission.SEND_COMMANDS)
    assert not has_permission(UserRole.VIEWER, Permission.EXPORT_DATA)


def test_operator_can_control_but_not_manage_or_export():
    assert has_permission(UserRole.OPERATOR, Permission.VIEW_DEVICES)
    assert has_permission(UserRole.OPERATOR, Permission.SEND_COMMANDS)
    assert has_permission(UserRole.OPERATOR, Permission.ACKNOWLEDGE_ALERTS)
    assert not has_permission(UserRole.OPERATOR, Permission.MANAGE_USERS)
    assert not has_permission(UserRole.OPERATOR, Permission.EXPORT_DATA)


def test_admin_can_export_and_control():
    assert has_permission(UserRole.ADMIN, Permission.VIEW_DEVICES)
    assert has_permission(UserRole.ADMIN, Permission.SEND_COMMANDS)
    assert has_permission(UserRole.ADMIN, Permission.MANAGE_ORGANISATIONS)
    assert has_permission(UserRole.ADMIN, Permission.EXPORT_DATA)
