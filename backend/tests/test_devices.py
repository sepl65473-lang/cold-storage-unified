"""Device create / edit / deactivate tests — Phase 7."""
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


def _mock_device() -> SimpleNamespace:
    """Build a plain namespace that looks like a Device ORM object."""
    return SimpleNamespace(
        id=uuid.uuid4(),
        organization_id=TEST_ORG_ID,
        name="Chamber A1",
        location_label="Zone A",
        location_lat=None,
        location_lng=None,
        thing_name=f"{TEST_ORG_ID}_{uuid.uuid4().hex[:8]}",
        is_active=True,
        firmware_version=None,
        last_seen=None,
        created_at=None,
        updated_at=None,
    )


def _db_with_device(device: SimpleNamespace) -> AsyncMock:
    """Mock DB session that returns a single device on execute + supports add/commit/refresh."""
    result = MagicMock()
    result.scalar_one_or_none.return_value = device
    result.scalars.return_value.all.return_value = [device]

    def _refresh(obj: object) -> None:
        now = datetime.now(timezone.utc)
        if not getattr(obj, "id", None):
            obj.id = uuid.uuid4()  # type: ignore[attr-defined]
        if not getattr(obj, "created_at", None):
            obj.created_at = now  # type: ignore[attr-defined]
        if not getattr(obj, "updated_at", None):
            obj.updated_at = now  # type: ignore[attr-defined]
        if not getattr(obj, "status", None):
            obj.status = "online"  # type: ignore[attr-defined]
        if getattr(obj, "is_active", None) is None:
            obj.is_active = True  # type: ignore[attr-defined]

    session = AsyncMock()
    session.execute = AsyncMock(return_value=result)
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock(side_effect=_refresh)
    return session


# ── List devices ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_devices_returns_list(viewer_client: AsyncClient) -> None:
    resp = await viewer_client.get("/api/v1/devices/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ── Create device (admin only) ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_device_as_admin_returns_201() -> None:
    """Admin can create a device (POST /devices/ → 201)."""
    device = _mock_device()
    admin = make_user(UserRole.SUPERADMIN)

    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: _db_with_device(device)

    async with AsyncClient(
        transport=__import__("httpx").ASGITransport(app=app), base_url="http://test"
    ) as ac:
        resp = await ac.post(
            "/api/v1/devices/",
            json={"name": "Chamber A1", "location_label": "Zone A"},
        )

    app.dependency_overrides.clear()
    assert resp.status_code in (200, 201), resp.text


@pytest.mark.asyncio
async def test_create_device_as_viewer_returns_403(viewer_client: AsyncClient) -> None:
    """Viewer cannot create a device → 403."""
    resp = await viewer_client.post(
        "/api/v1/devices/",
        json={"name": "Chamber A1", "location_label": "Zone A"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_device_as_operator_returns_403(operator_client: AsyncClient) -> None:
    """Operator cannot create a device → 403."""
    resp = await operator_client.post(
        "/api/v1/devices/",
        json={"name": "Chamber A1", "location_label": "Zone A"},
    )
    assert resp.status_code == 403


# ── Edit device (admin only) ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_edit_device_as_admin_returns_200() -> None:
    """Admin can PATCH a device."""
    device = _mock_device()
    admin = make_user(UserRole.SUPERADMIN)

    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: _db_with_device(device)

    async with AsyncClient(
        transport=__import__("httpx").ASGITransport(app=app), base_url="http://test"
    ) as ac:
        resp = await ac.patch(
            f"/api/v1/devices/{device.id}",
            json={"name": "Chamber A1 Updated"},
        )

    app.dependency_overrides.clear()
    assert resp.status_code in (200, 201), resp.text


@pytest.mark.asyncio
async def test_edit_device_as_viewer_returns_403(viewer_client: AsyncClient) -> None:
    """Viewer cannot PATCH a device → 403."""
    resp = await viewer_client.patch(
        f"/api/v1/devices/{uuid.uuid4()}",
        json={"name": "Updated"},
    )
    assert resp.status_code == 403


# ── Deactivate device (admin only, PATCH is_active=false) ────────────────────

@pytest.mark.asyncio
async def test_deactivate_device_as_admin_returns_200() -> None:
    """Admin can deactivate a device via PATCH is_active=false."""
    device = _mock_device()
    admin = make_user(UserRole.SUPERADMIN)

    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: _db_with_device(device)

    async with AsyncClient(
        transport=__import__("httpx").ASGITransport(app=app), base_url="http://test"
    ) as ac:
        resp = await ac.patch(
            f"/api/v1/devices/{device.id}",
            json={"name": device.name, "is_active": False},
        )

    app.dependency_overrides.clear()
    assert resp.status_code in (200, 201), resp.text


@pytest.mark.asyncio
async def test_get_nonexistent_device_returns_404() -> None:
    """GET a device that doesn't exist returns 404."""
    from tests.conftest import mock_db_empty
    admin = make_user(UserRole.SUPERADMIN)

    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db_empty()

    async with AsyncClient(
        transport=__import__("httpx").ASGITransport(app=app), base_url="http://test"
    ) as ac:
        resp = await ac.get(f"/api/v1/devices/{uuid.uuid4()}")

    app.dependency_overrides.clear()
    assert resp.status_code == 404
