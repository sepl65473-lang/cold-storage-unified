"""Alert list and resolve tests — Phase 7."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient

from app.db.session import get_db
from app.dependencies import get_current_user
from app.main import app
from app.models.user import UserRole
from tests.conftest import TEST_ORG_ID, make_user


def _mock_alert(resolved: bool = False) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        organization_id=TEST_ORG_ID,
        device_id=uuid.uuid4(),
        type="temp_high",
        severity="warning",
        message="Temperature exceeded threshold",
        is_resolved=resolved,
        resolved_at=None,
        resolved_by=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _db_with_alert(alert: SimpleNamespace) -> AsyncMock:
    result = MagicMock()
    result.scalar_one_or_none.return_value = alert
    result.scalars.return_value.all.return_value = [alert]

    session = AsyncMock()
    session.execute = AsyncMock(return_value=result)
    session.commit = AsyncMock()
    session.add = MagicMock()
    return session


# ── List alerts ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_alerts_as_viewer_returns_200(viewer_client: AsyncClient) -> None:
    """Viewer can list alerts (VIEW_DEVICES permission)."""
    resp = await viewer_client.get("/api/v1/alerts/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_list_alerts_unauthenticated_returns_401(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/alerts/")
    assert resp.status_code == 401


# ── Resolve alert ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_resolve_alert_as_operator_returns_200() -> None:
    """Operator can resolve an active alert."""
    alert = _mock_alert(resolved=False)
    operator = make_user(UserRole.OPERATOR)

    app.dependency_overrides[get_current_user] = lambda: operator
    app.dependency_overrides[get_db] = lambda: _db_with_alert(alert)

    async with AsyncClient(
        transport=__import__("httpx").ASGITransport(app=app), base_url="http://test"
    ) as ac:
        resp = await ac.patch(
            f"/api/v1/alerts/{alert.id}/resolve",
            json={"resolved": True},
        )

    app.dependency_overrides.clear()
    assert resp.status_code == 200, resp.text


@pytest.mark.asyncio
async def test_resolve_alert_as_admin_returns_200() -> None:
    """Admin can resolve an active alert."""
    alert = _mock_alert(resolved=False)
    admin = make_user(UserRole.ADMIN)

    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: _db_with_alert(alert)

    async with AsyncClient(
        transport=__import__("httpx").ASGITransport(app=app), base_url="http://test"
    ) as ac:
        resp = await ac.patch(
            f"/api/v1/alerts/{alert.id}/resolve",
            json={"resolved": True},
        )

    app.dependency_overrides.clear()
    assert resp.status_code == 200, resp.text


@pytest.mark.asyncio
async def test_resolve_alert_as_viewer_returns_403(viewer_client: AsyncClient) -> None:
    """Viewer cannot resolve alerts (ACKNOWLEDGE_ALERTS not in viewer perms)."""
    resp = await viewer_client.patch(
        f"/api/v1/alerts/{uuid.uuid4()}/resolve",
        json={"resolved": True},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_resolve_nonexistent_alert_returns_404() -> None:
    """Resolving a non-existent alert ID returns 404."""
    from tests.conftest import mock_db_empty
    operator = make_user(UserRole.OPERATOR)

    app.dependency_overrides[get_current_user] = lambda: operator
    app.dependency_overrides[get_db] = lambda: mock_db_empty()

    async with AsyncClient(
        transport=__import__("httpx").ASGITransport(app=app), base_url="http://test"
    ) as ac:
        resp = await ac.patch(
            f"/api/v1/alerts/{uuid.uuid4()}/resolve",
            json={"resolved": True},
        )

    app.dependency_overrides.clear()
    assert resp.status_code == 404
