from __future__ import annotations

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.db.session import AsyncSessionLocal
from app.models.audit_log import AuditLog

logger = structlog.get_logger(__name__)


class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        method = request.method
        path = request.url.path

        # Check if this is a modifying API request (PUT, PATCH, DELETE, POST)
        is_write = method in ("DELETE", "PATCH", "PUT", "POST")
        is_api = path.startswith("/api/v1")
        
        # Skip telemetry ingest and logins to prevent bloat
        is_telemetry_or_auth = (
            "/auth/login" in path
            or "/readings/ingest" in path
            or "/readings/batch-ingest" in path
            or "/readings/ingest-batch" in path
        )

        should_audit = is_write and is_api and not is_telemetry_or_auth

        response: Response = await call_next(request)

        # Log audit record on successful operations (2xx status codes)
        if should_audit and 200 <= response.status_code < 300:
            user = getattr(request.state, "user", None)
            org_id = getattr(request.state, "org_id", None)

            if user:
                # Parse resource type and ID from path
                # Path structure: /api/v1/devices/uuid -> parts: ["api", "v1", "devices", "uuid"]
                parts = [p for p in path.split("/") if p]
                resource_type = "Unknown"
                resource_id = None
                
                if len(parts) >= 3:
                    resource_type = parts[2].replace("-", " ").title()
                    if len(parts) >= 4:
                        resource_id = parts[3]

                action_map = {
                    "POST": "CREATE",
                    "PUT": "UPDATE",
                    "PATCH": "UPDATE",
                    "DELETE": "DELETE",
                }
                action_name = f"{resource_type.upper().replace(' ', '_')}_{action_map.get(method, 'ACTION')}"

                try:
                    async with AsyncSessionLocal() as db:
                        log = AuditLog(
                            user_id=user.id,
                            organization_id=org_id,
                            action=action_name,
                            resource_type=resource_type,
                            resource_id=resource_id,
                            details={
                                "path": path,
                                "method": method,
                                "status_code": response.status_code,
                            },
                            ip_address=request.client.host if request.client else None,
                            user_agent=request.headers.get("user-agent"),
                        )
                        db.add(log)
                        await db.commit()
                except Exception as exc:
                    logger.error("Failed to save audit log in middleware", error=str(exc))

        return response
