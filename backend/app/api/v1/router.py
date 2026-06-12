"""FastAPI REST router mapping."""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.commands import router as commands_router
from app.api.v1.devices import router as devices_router
from app.api.v1.readings import router as readings_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.admin.users import router as admin_users_router
from app.api.v1.admin.ota import router as admin_ota_router
from app.api.v1.contact import router as contact_router
from app.api.v1.stream import router as stream_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.reports import router as reports_router
from app.api.v1.gateways import router as gateways_router
from app.api.v1.work_orders import router as work_orders_router
from app.api.v1.dispatch import router as dispatch_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.produce import router as produce_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.alert_rules import router as alert_rules_router
from app.api.v1.audit import router as audit_router
from app.api.v1.roles import router as roles_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(contact_router, prefix="/contact", tags=["Marketing Site"])
api_router.include_router(stream_router, tags=["Stream"])
api_router.include_router(dashboard_router, tags=["Dashboard Bridge"])
api_router.include_router(devices_router, prefix="/devices", tags=["Devices"])
api_router.include_router(commands_router, prefix="/devices", tags=["Device Commands"])
api_router.include_router(readings_router, prefix="/readings", tags=["Sensor Readings"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(admin_users_router, prefix="/admin/users", tags=["Admin: Users"])
api_router.include_router(admin_ota_router, prefix="/admin/ota", tags=["Admin: OTA Updates"])
api_router.include_router(reports_router, prefix="/reports", tags=["Reports"])
api_router.include_router(gateways_router, prefix="/gateways", tags=["Gateways"])
api_router.include_router(work_orders_router, prefix="/work-orders", tags=["Work Orders"])
api_router.include_router(dispatch_router, prefix="/dispatch", tags=["Dispatch"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(produce_router, prefix="/produce", tags=["Produce"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(alert_rules_router, prefix="/alert-rules", tags=["Alert Rules"])
api_router.include_router(audit_router, prefix="/audit", tags=["Audit Logs"])
api_router.include_router(roles_router, prefix="/roles", tags=["Roles"])


@api_router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
