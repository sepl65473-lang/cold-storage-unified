"""MQTT bridge — handles incoming messages from AWS IoT Core (prod) or Mosquitto (dev).

Architecture:
  - In dev: paho-mqtt subscribes to broker directly.
  - In prod: AWS IoT Core Rule forwards messages to SQS; a separate SQS consumer
    (run as a separate ECS service or Lambda) calls ingest tasks.
    This module provides the dev bridge for local testing.
"""
from __future__ import annotations

import json
import ssl
import threading
from typing import Any

import paho.mqtt.client as mqtt
import structlog

from app.config import settings
from app.mqtt.topics import parse_topic
from app.workers.ingest import ingest_telemetry, process_device_status

logger = structlog.get_logger(__name__)


class MQTTBridge:
    """Dev-mode MQTT bridge — connects to Mosquitto and routes messages to Celery tasks."""

    def __init__(self) -> None:
        self._client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id="cold-storage-backend-bridge",
            protocol=mqtt.MQTTv5,
        )
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._client.on_disconnect = self._on_disconnect
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if settings.MQTT_USE_TLS:
            ctx = ssl.create_default_context()
            ctx.load_cert_chain(
                certfile=settings.AWS_IOT_CLIENT_CERT,
                keyfile=settings.AWS_IOT_CLIENT_KEY,
            )
            ctx.load_verify_locations(cafile=settings.AWS_IOT_CA_CERT)
            self._client.tls_set_context(ctx)

        try:
            self._client.connect(
                host=settings.MQTT_BROKER_HOST,
                port=settings.MQTT_BROKER_PORT,
                keepalive=60,
            )
            self._client.loop_start()
            logger.info("MQTT bridge started with loop_start", host=settings.MQTT_BROKER_HOST, port=settings.MQTT_BROKER_PORT)
        except Exception as e:
            logger.error("MQTT bridge failed to start", error=str(e))

    def stop(self) -> None:
        self._client.loop_stop()
        self._client.disconnect()

    def _on_connect(self, client: mqtt.Client, userdata: Any, flags: Any, rc: int, properties=None) -> None:
        if rc == 0:
            logger.info("MQTT connected and ready to subscribe")
            # Subscribe to all telemetry + status topics
            subs = [
                ("coldstorage/#", 1),
            ]
            for topic, qos in subs:
                res, mid = client.subscribe(topic, qos=qos)
                logger.info("MQTT subscribing", topic=topic, result=res, mid=mid)
        else:
            logger.error("MQTT connection failed", rc=rc)

    def _on_message(self, client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage) -> None:
        try:
            logger.info("received_mqtt_message", topic=msg.topic)
            payload_raw = json.loads(msg.payload.decode("utf-8"))
            topic_info = parse_topic(msg.topic)
            if not topic_info:
                logger.warning("failed_to_parse_topic", topic=msg.topic)
                return

            payload = {**payload_raw, **topic_info}
            logger.info("dispatching_to_celery", topic=msg.topic, task="ingest_telemetry")

            if "telemetry" in msg.topic:
                from app.workers.ingest import ingest_telemetry
                res = ingest_telemetry.delay(payload)
                logger.info("dispatching_to_celery", task_id=res.id, topic=msg.topic)
            elif "heartbeat" in msg.topic:
                # Update status
                from app.workers.ingest import ingest_telemetry
                ingest_telemetry.delay(payload)
            elif "commands/ack" in msg.topic:
                from app.workers.ota_publisher import handle_command_ack
                handle_command_ack.apply_async(args=[payload], queue="default")
            elif "ota/ack" in msg.topic:
                from app.workers.ota_publisher import handle_ota_ack
                handle_ota_ack.apply_async(args=[payload], queue="default")

        except Exception as exc:
            logger.error("MQTT message processing error", topic=msg.topic, error=str(exc))

    def _on_disconnect(self, client, userdata, rc, properties=None) -> None:
        logger.warning("MQTT disconnected", rc=rc)


# Singleton bridge instance
_bridge: MQTTBridge | None = None


def get_mqtt_bridge() -> MQTTBridge:
    global _bridge
    if _bridge is None:
        _bridge = MQTTBridge()
    return _bridge
