"""Real-time telemetry stream service using Redis Pub/Sub."""
import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket
import structlog
from app.config import settings
import redis.asyncio as redis

logger = structlog.get_logger(__name__)

class StreamManager:
    def __init__(self):
        # org_id -> set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.pubsub = self.redis_client.pubsub()
        self.is_running = False

    async def connect(self, websocket: WebSocket, org_id: str):
        await websocket.accept()
        if org_id not in self.active_connections:
            self.active_connections[org_id] = set()
            # If this is the first connection for this org, we could subscribe to its channel
            # But for simplicity, we subscribe to a global "telemetry" channel or a pattern
            if not self.is_running:
                 asyncio.create_task(self._listen_to_redis())
                 self.is_running = True
        
        self.active_connections[org_id].add(websocket)
        logger.info("WebSocket connected", org_id=org_id, total_connections=len(self.active_connections[org_id]))

    def disconnect(self, websocket: WebSocket, org_id: str):
        if org_id in self.active_connections:
            self.active_connections[org_id].remove(websocket)
            if not self.active_connections[org_id]:
                del self.active_connections[org_id]
        logger.info("WebSocket disconnected", org_id=org_id)

    async def _listen_to_redis(self):
        """Background task to listen to Redis and broadcast to WebSockets."""
        logger.info("Starting Redis Pub/Sub listener for telemetry")
        await self.pubsub.subscribe("telemetry_stream")
        
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    org_id = data.get("organization_id")
                    if org_id and org_id in self.active_connections:
                        # Broadcast to all listeners in this organization
                        disconnected = set()
                        for ws in self.active_connections[org_id]:
                            try:
                                await ws.send_json(data)
                            except Exception:
                                disconnected.add(ws)
                        
                        for ws in disconnected:
                            self.active_connections[org_id].remove(ws)
        except Exception as e:
            logger.error("Redis Pub/Sub listener error", error=str(e))
            self.is_running = False

stream_manager = StreamManager()
