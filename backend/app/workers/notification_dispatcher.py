"""Notification dispatcher — FCM, Web Push (VAPID), Amazon SES fallback."""
from __future__ import annotations

import asyncio
import uuid
from typing import Any

import structlog
from celery import shared_task
from firebase_admin import credentials, initialize_app, messaging
from pywebpush import webpush, WebPushException
from sqlalchemy import select

from app.config import settings
from app.db.session import AsyncSessionLocal
from app.models.alert import Alert, AlertSeverity

logger = structlog.get_logger(__name__)

# Initialize Firebase Admin SDK (lazy, once per worker process)
_firebase_initialized = False

def _ensure_firebase():
    global _firebase_initialized
    if not _firebase_initialized and settings.FCM_SERVER_KEY:
        cred = credentials.Certificate(settings.FCM_SERVER_KEY)
        initialize_app(cred)
        _firebase_initialized = True


def _run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@shared_task(name="app.workers.notification_dispatcher.dispatch_alert_notification",
             bind=True, max_retries=3, default_retry_delay=30)
def dispatch_alert_notification(self, alert_id: str):
    """Main dispatch task — resolves alert and routes to all channels."""
    _run_async(_dispatch(alert_id))


async def _dispatch(alert_id: str) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Alert).where(Alert.id == uuid.UUID(alert_id))
        )
        alert = result.scalar_one_or_none()
        if not alert:
            logger.warning("Alert not found for dispatch", alert_id=alert_id)
            return

        # Fetch users in the org with push subscriptions / FCM tokens
        # (abbreviated — full implementation fetches from user_device_tokens table)
        title = f"{'🚨 CRITICAL' if alert.severity == AlertSeverity.CRITICAL else '⚠️ Warning'}: {alert.type.replace('_', ' ').title()}"
        body = alert.message
        data = {
            "alert_id": str(alert.id),
            "device_id": str(alert.device_id),
            "type": alert.type,
            "severity": alert.severity,
        }

        # 1. FCM — Android push
        fcm_success = await _send_fcm(title=title, body=body, data=data, org_id=str(alert.organization_id))

        # 2. Web Push — browser notification
        await _send_web_push(title=title, body=body, data=data, org_id=str(alert.organization_id))

        # 3. Email fallback — only for CRITICAL alerts or if FCM failed
        if alert.severity == AlertSeverity.CRITICAL or not fcm_success:
            await _send_email_fallback(alert=alert, title=title, body=body)


async def _send_fcm(*, title: str, body: str, data: dict, org_id: str) -> bool:
    """Send high-priority FCM push to all org device tokens."""
    _ensure_firebase()
    if not _firebase_initialized:
        if settings.ENVIRONMENT == "development":
            logger.info("MOCK FCM SENT (Dev Mode)", title=title, body=body, org_id=org_id)
            return True
        return False

    try:
        # Multicast to org topic (devices subscribed to org/{org_id})
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in data.items()},
            android=messaging.AndroidConfig(priority="high"),
            topic=f"org_{org_id}",
        )
        response = messaging.send(message)
        logger.info("FCM sent", response=response)
        return True
    except Exception as exc:
        logger.error("FCM dispatch failed", error=str(exc))
        return False


async def _send_web_push(*, title: str, body: str, data: dict, org_id: str) -> None:
    """Send Web Push to all stored VAPID subscriptions for the org."""
    if not settings.VAPID_PRIVATE_KEY:
        return

    async with AsyncSessionLocal() as db:
        from sqlalchemy import text
        result = await db.execute(
            text("SELECT endpoint, p256dh_key, auth_key FROM user_push_subscriptions "
                 "JOIN users ON users.id = user_push_subscriptions.user_id "
                 "WHERE users.organization_id = :org_id AND users.is_active = true"),
            {"org_id": uuid.UUID(org_id)},
        )
        subscriptions = result.fetchall()

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh_key, "auth": sub.auth_key}},
                data=f'{{"title": "{title}", "body": "{body}"}}',
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIM_EMAIL}"},
            )
        except WebPushException as exc:
            logger.warning("Web push failed for subscription", endpoint=sub.endpoint[:30], error=str(exc))


async def _send_email_fallback(*, alert: Alert, title: str, body: str) -> None:
    """Send email via Amazon SES or SendGrid as critical alert fallback."""
    if settings.EMAIL_PROVIDER == "ses":
        await _send_ses(title=title, body=body, org_id=str(alert.organization_id))
    else:
        await _send_sendgrid(title=title, body=body, org_id=str(alert.organization_id))


async def _send_ses(*, title: str, body: str, org_id: str) -> None:
    import boto3
    ses = boto3.client("ses", region_name=settings.AWS_REGION)
    try:
        # In production: fetch admin emails from DB by org_id
        ses.send_email(
            Source=settings.SES_FROM_EMAIL,
            Destination={"ToAddresses": [settings.SES_FROM_EMAIL]},  # Replace with org admin emails
            Message={
                "Subject": {"Data": title},
                "Body": {"Text": {"Data": body}},
            },
        )
        logger.info("SES email sent", org_id=org_id)
    except Exception as exc:
        logger.error("SES dispatch failed", error=str(exc))


async def _send_sendgrid(*, title: str, body: str, org_id: str) -> None:
    # SendGrid via HTTP — similar pattern with requests/httpx
    logger.info("SendGrid dispatch called", org_id=org_id)
