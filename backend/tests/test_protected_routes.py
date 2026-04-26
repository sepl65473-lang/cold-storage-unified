"""Protected route tests — 401 without token, 403 for wrong role — Phase 7."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.user import UserRole


# ── 401: No token / bad token ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_no_token_returns_401(client: AsyncClient) -> None:
    """Unauthenticated request to any protected endpoint returns 401."""
    resp = await client.get("/api/v1/chambers")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_invalid_token_returns_401(client: AsyncClient) -> None:
    """Malformed / tampered token returns 401."""
    resp = await client.get(
        "/api/v1/chambers",
        headers={"Authorization": "Bearer this.is.not.a.valid.token"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_wrong_scheme_returns_401(client: AsyncClient) -> None:
    """Basic auth scheme (not Bearer) returns 401."""
    resp = await client.get(
        "/api/v1/devices/",
        headers={"Authorization": "Basic dXNlcjpwYXNz"},
    )
    assert resp.status_code == 401


# ── 403: Viewer cannot write ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_viewer_cannot_create_device(viewer_client: AsyncClient) -> None:
    """Viewer role → POST /devices/ returns 403."""
    resp = await viewer_client.post(
        "/api/v1/devices/",
        json={"name": "Test Chamber", "location_label": "Zone A"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_resolve_alert(viewer_client: AsyncClient) -> None:
    """Viewer role → PATCH /alerts/{id}/resolve returns 403."""
    import uuid
    resp = await viewer_client.patch(
        f"/api/v1/alerts/{uuid.uuid4()}/resolve",
        json={"resolved": True},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_download_report(viewer_client: AsyncClient) -> None:
    """Viewer role → GET /reports/weekly-temp/download returns 403."""
    resp = await viewer_client.get("/api/v1/reports/weekly-temp/download")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_list_reports(viewer_client: AsyncClient) -> None:
    """Viewer role → GET /reports/ returns 403 (EXPORT_DATA required)."""
    resp = await viewer_client.get("/api/v1/reports/")
    assert resp.status_code == 403


# ── Viewer CAN read ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_viewer_can_read_chambers(viewer_client: AsyncClient) -> None:
    """Viewer role → GET /chambers returns 200 (VIEW_DEVICES allowed)."""
    resp = await viewer_client.get("/api/v1/chambers")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_viewer_can_list_devices(viewer_client: AsyncClient) -> None:
    """Viewer role → GET /devices/ returns 200."""
    resp = await viewer_client.get("/api/v1/devices/")
    assert resp.status_code == 200


# ── Operator access ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_operator_cannot_create_device(operator_client: AsyncClient) -> None:
    """Operator role → POST /devices/ returns 403 (MANAGE_ORGANISATIONS required)."""
    resp = await operator_client.post(
        "/api/v1/devices/",
        json={"name": "Test Chamber", "location_label": "Zone B"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_operator_cannot_download_report(operator_client: AsyncClient) -> None:
    """Operator role → GET /reports/ returns 403 (EXPORT_DATA required)."""
    resp = await operator_client.get("/api/v1/reports/")
    assert resp.status_code == 403


# ── Admin access ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_admin_can_list_reports(admin_client: AsyncClient) -> None:
    """Admin role → GET /reports/ returns 200."""
    resp = await admin_client.get("/api/v1/reports/")
    assert resp.status_code == 200
