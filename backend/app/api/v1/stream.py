"""WebSocket Stream API router."""
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
import structlog
from app.services.stream import stream_manager
from app.auth.jwt import verify_access_token
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time telemetry.
    Expects a JWT token in the query string for authentication.
    """
    try:
        # Authenticate token
        payload = verify_access_token(token)
        if not payload:
            await websocket.close(code=4001) # Policy Violation
            return
        
        user_id = payload.get("sub")
        
        # Get user's org_id
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
            user = result.scalar_one_or_none()
            if not user or not user.organization_id:
                await websocket.close(code=4003) # Forbidden
                return
            
            org_id = str(user.organization_id)

        # Connect to stream manager
        await stream_manager.connect(websocket, org_id)
        
        try:
            while True:
                # Keep connection alive and listen for client messages (if any)
                data = await websocket.receive_text()
                # We don't expect messages from client for now, but we can handle them here
        except WebSocketDisconnect:
            stream_manager.disconnect(websocket, org_id)
            
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        try:
            await websocket.close(code=1011) # Internal Error
        except:
            pass
