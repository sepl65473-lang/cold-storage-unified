"""Device Remote Command API."""
from __future__ import annotations

import json
import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import Permission, require_permission
from app.db.session import get_db
from app.dependencies import get_current_org_id, get_current_user
from app.models.command_audit import DeviceCommand
from app.models.device import Device
from app.models.user import User
from app.mqtt.topics import command_topic
from app.schemas.reading import CommandCreate, CommandResponse

router = APIRouter()


@router.get("/{device_id}/commands", response_model=list[CommandResponse])
async def list_commands(
    device_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> Sequence[DeviceCommand]:
    result = await db.execute(
        select(DeviceCommand)
        .where(DeviceCommand.device_id == device_id)
        .order_by(DeviceCommand.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.post("/{device_id}/commands", response_model=CommandResponse, status_code=status.HTTP_201_CREATED)
async def send_command(
    device_id: uuid.UUID,
    payload: CommandCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(Permission.SEND_COMMANDS)),
) -> DeviceCommand:
    """Send remote command (toggle cooling, fan, reboot) via MQTT with QoS 1."""
    # Ensure device belongs to org
    res = await db.execute(select(Device).where(Device.id == device_id, Device.organization_id == org_id))
    device = res.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Command audit record
    command = DeviceCommand(
        device_id=device_id,
        issued_by=user.id,
        type=payload.type,
        value=payload.value,
        status="pending",
    )
    db.add(command)
    await db.flush()  # to get command.id

    msg_payload = {
        "command_id": str(command.id),
        "type": command.type,
        "value": command.value,
        "issued_at": command.created_at.isoformat(),
    }

    # Dispatch via Mosquitto (dev) or AWS IoT Core (prod) securely
    from app.config import settings
    if settings.ENVIRONMENT == "development":
        from app.mqtt.client import get_mqtt_bridge
        topic = command_topic(str(org_id), str(device_id))
        pub_info = get_mqtt_bridge()._client.publish(topic, json.dumps(msg_payload), qos=1)
        command.mqtt_message_id = str(pub_info.mid)
    else:
        import boto3
        iot_data = boto3.client("iot-data", region_name=settings.AWS_REGION, endpoint_url=settings.AWS_IOT_ENDPOINT)
        topic = command_topic(str(org_id), str(device_id))
        iot_data.publish(topic=topic, qos=1, payload=json.dumps(msg_payload))

    await db.commit()
    await db.refresh(command)
    return command
