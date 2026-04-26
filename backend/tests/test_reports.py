"""Report list and download tests — Phase 7."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


# ── List reports ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_reports_as_admin_returns_200(admin_client: AsyncClient) -> None:
    """Admin can list available reports."""
    resp = await admin_client.get("/api/v1/reports/")
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    assert len(body) > 0


@pytest.mark.asyncio
async def test_list_reports_metadata_shape(admin_client: AsyncClient) -> None:
    """Each report entry has required metadata fields."""
    resp = await admin_client.get("/api/v1/reports/")
    assert resp.status_code == 200
    for report in resp.json():
        for key in ("id", "title", "type", "date", "status"):
            assert key in report, f"Report entry missing key: {key}"


@pytest.mark.asyncio
async def test_list_reports_as_viewer_returns_403(viewer_client: AsyncClient) -> None:
    """Viewer cannot list reports (EXPORT_DATA required)."""
    resp = await viewer_client.get("/api/v1/reports/")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_reports_as_operator_returns_403(operator_client: AsyncClient) -> None:
    """Operator cannot list reports (EXPORT_DATA required)."""
    resp = await operator_client.get("/api/v1/reports/")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_reports_unauthenticated_returns_401(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/reports/")
    assert resp.status_code == 401


# ── Download report ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_download_report_as_viewer_returns_403(viewer_client: AsyncClient) -> None:
    """Viewer cannot download any report → 403."""
    resp = await viewer_client.get("/api/v1/reports/weekly-temp/download")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_download_report_as_operator_returns_403(operator_client: AsyncClient) -> None:
    """Operator cannot download reports → 403."""
    resp = await operator_client.get("/api/v1/reports/weekly-temp/download")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_download_report_unauthenticated_returns_401(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/reports/weekly-temp/download")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_download_unknown_report_as_admin_returns_csv(admin_client: AsyncClient) -> None:
    """Unknown report ID falls back to an empty CSV (not 404) — endpoint behaviour."""
    resp = await admin_client.get("/api/v1/reports/does-not-exist/download")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
