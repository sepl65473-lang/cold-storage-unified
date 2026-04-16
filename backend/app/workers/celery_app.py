"""Celery application factory and task queues."""
from __future__ import annotations

from celery import Celery

from app.config import settings

celery_app = Celery(
    "cold_storage",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.ingest",
        "app.workers.alert_evaluator",
        "app.workers.notification_dispatcher",
        "app.workers.ota_publisher",
    ],
)

# Ensure tasks are registered
import app.workers.ingest
import app.workers.alert_evaluator
import app.workers.notification_dispatcher
import app.workers.ota_publisher

print(f"DEBUG: Registered tasks keys: {celery_app.tasks.keys()}")

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,          # Ack only after successful processing
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1, # Fair dispatch for long tasks
    # Queues
    task_queues={
        "default": {"exchange": "default", "routing_key": "default"},
        "alerts": {"exchange": "alerts", "routing_key": "alerts"},
        "notifications": {"exchange": "notifications", "routing_key": "notifications"},
    },
    task_default_queue="default",
    task_routes={
        "app.workers.alert_evaluator.*": {"queue": "alerts"},
        "app.workers.notification_dispatcher.*": {"queue": "notifications"},
    },
    # Beat schedule — runs on celery_beat container
    beat_schedule={
        "evaluate-alerts-every-60s": {
            "task": "app.workers.alert_evaluator.run_alert_evaluation",
            "schedule": 60.0,  # seconds
        },
        "check-offline-devices-every-60s": {
            "task": "app.workers.alert_evaluator.check_offline_devices",
            "schedule": 60.0,
        },
    },
)
