"""OTA update publisher — generates S3 pre-signed URLs and broadcasts via MQTT."""
from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Any

import boto3
import structlog
from celery import shared_task
from sqlalchemy import select

from app.config import settings
from app.db.session import AsyncSessionLocal
from app.models.device import Device
from app.mqtt.topics import ota_broadcast_topic

logger = structlog.get_logger(__name__)

# TTL for the pre-signed S3 URL (in seconds)
_PRESIGNED_URL_TTL = 3600  # 1 hour


def _run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@shared_task(name="app.workers.ota_publisher.publish_ota_release", bind=True, max_retries=3)
def publish_ota_release(self, org_id: str, version: str, s3_key: str):
    """
    Called when an admin pushes a new firmware version.
    1. Generates an S3 pre-signed HTTPS GET URL.
    2. Fetches the SHA-256 hash from S3 object metadata.
    3. Broadcasts the OTA release to the organization's MQTT OTA topic.
    """
    _run_async(_process_publish_ota(org_id, version, s3_key))


@shared_task(name="app.workers.ota_publisher.handle_ota_ack")
def handle_ota_ack(payload: dict[str, Any]):
    """Processes device acknowledgment after completing an OTA update (success or failure)."""
    _run_async(_process_ota_ack(payload))


@shared_task(name="app.workers.ota_publisher.handle_command_ack")
def handle_command_ack(payload: dict[str, Any]):
    """Processes device acknowledgment for a remote command."""
    _run_async(_process_command_ack(payload))


async def _process_publish_ota(org_id: str, version: str, s3_key: str) -> None:
    if not settings.FIRMWARE_S3_BUCKET:
        logger.warning("FIRMWARE_S3_BUCKET not set, skipping OTA publish")
        return

    s3 = boto3.client("s3", region_name=settings.AWS_REGION)

    try:
        # Fetch object metadata to get the SHA-256 hash
        head = s3.head_object(Bucket=settings.FIRMWARE_S3_BUCKET, Key=s3_key)
        sha256hash = head.get("Metadata", {}).get("sha256hash")
        if not sha256hash:
            logger.error("OTA binary in S3 is missing 'sha256hash' metadata", s3_key=s3_key)
            return

        # Generate pre-signed URL
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.FIRMWARE_S3_BUCKET, "Key": s3_key},
            ExpiresIn=_PRESIGNED_URL_TTL,
        )
    except Exception as exc:
        logger.error("Failed to generate S3 pre-signed URL", error=str(exc))
        return

    # Broadcast via MQTT
    topic = ota_broadcast_topic(org_id)
    payload = json.dumps({
        "version": version,
        "url": url,
        "sha256": sha256hash,
    })

    _publish_mqtt(topic, payload, qos=1)
    logger.info("OTA broadcast published", org_id=org_id, version=version)


async def _process_ota_ack(payload: dict[str, Any]) -> None:
    from app.models.ota import OTAStatus, OTAUpdate

    device_id = payload.get("device_id")
    version = payload.get("version")
    status = payload.get("status")  # "success" or "failed"
    error = payload.get("error")

    if not device_id or not version or not status:
        return

    async with AsyncSessionLocal() as db:
        # Update the specific OTA update record
        # Find the latest pending/started update for this device and version
        stmt = (
            select(OTAUpdate)
            .where(OTAUpdate.device_id == device_id)
            .order_by(OTAUpdate.created_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        ota_update = result.scalar_one_or_none()

        if ota_update:
            if status == "success":
                ota_update.status = "completed"
                ota_update.progress = 100
                ota_update.completed_at = datetime.utcnow()
            else:
                ota_update.status = "failed"
                ota_update.error_message = error or "Device reported failure"
                ota_update.completed_at = datetime.utcnow()

        # Update the device's main firmware version field on success
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalar_one_or_none()
        if device and status == "success":
            device.firmware_version = version

        await db.commit()
        logger.info("OTA acknowledgment processed", device_id=device_id, status=status)


async def _process_command_ack(payload: dict[str, Any]) -> None:
    from app.models.command_audit import CommandStatus, DeviceCommand

    command_id = payload.get("command_id")
    if not command_id:
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(DeviceCommand).where(DeviceCommand.id == command_id))
        command = result.scalar_one_or_none()
        if command:
            command.status = CommandStatus.ACKNOWLEDGED
            command.acknowledged_at = datetime.utcnow()
            await db.commit()
            logger.info("Command acknowledged by device", command_id=command_id)


def _publish_mqtt(topic: str, payload: str, qos: int = 1) -> None:
    """Helper to publish via Mosquitto (dev) or AWS IoT Data (prod)."""
    if settings.ENVIRONMENT == "development":
        from app.mqtt.client import get_mqtt_bridge
        get_mqtt_bridge()._client.publish(topic, payload, qos=qos)
    else:
        iot_data = boto3.client("iot-data", region_name=settings.AWS_REGION, endpoint_url=settings.AWS_IOT_ENDPOINT)
        iot_data.publish(topic=topic, qos=qos, payload=payload)
