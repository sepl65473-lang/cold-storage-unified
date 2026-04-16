"""MQTT topic constants and parser."""
from __future__ import annotations

# Topic format: coldstorage/{org_id}/{device_id}/{suffix}
_TOPIC_PREFIX = "coldstorage"


def telemetry_topic(org_id: str, device_id: str) -> str:
    return f"{_TOPIC_PREFIX}/{org_id}/{device_id}/telemetry"


def heartbeat_topic(org_id: str, device_id: str) -> str:
    return f"{_TOPIC_PREFIX}/{org_id}/{device_id}/heartbeat"


def command_topic(org_id: str, device_id: str) -> str:
    return f"{_TOPIC_PREFIX}/{org_id}/{device_id}/commands"


def command_ack_topic(org_id: str, device_id: str) -> str:
    return f"{_TOPIC_PREFIX}/{org_id}/{device_id}/commands/ack"


def status_topic(org_id: str, device_id: str) -> str:
    return f"{_TOPIC_PREFIX}/{org_id}/{device_id}/status"


def ota_broadcast_topic(org_id: str) -> str:
    return f"{_TOPIC_PREFIX}/{org_id}/ota/broadcast"


def ota_ack_topic(org_id: str, device_id: str) -> str:
    return f"{_TOPIC_PREFIX}/{org_id}/{device_id}/ota/ack"


def parse_topic(topic: str) -> dict[str, str] | None:
    """Parse a topic string into org_id and device_id components."""
    parts = topic.split("/")
    if len(parts) < 4 or parts[0] != _TOPIC_PREFIX:
        return None
    return {"org_id": parts[1], "device_id": parts[2]}
