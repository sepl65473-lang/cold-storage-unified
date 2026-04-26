"""Dashboard data rendering tests — Phase 7."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_stats_returns_200_with_required_keys(viewer_client: AsyncClient) -> None:
    """GET /stats returns 200 with all required dashboard keys."""
    resp = await viewer_client.get("/api/v1/stats")
    assert resp.status_code == 200
    body = resp.json()
    for key in ("avgTemp", "avgHumidity", "activeChambers", "totalChambers", "activeAlerts"):
        assert key in body, f"Missing key: {key}"


@pytest.mark.asyncio
async def test_stats_values_are_numeric(viewer_client: AsyncClient) -> None:
    """Dashboard stats values must all be numeric (not None / string)."""
    resp = await viewer_client.get("/api/v1/stats")
    assert resp.status_code == 200
    body = resp.json()
    for key in ("avgTemp", "avgHumidity", "activeChambers", "totalChambers", "activeAlerts"):
        assert isinstance(body[key], (int, float)), f"{key} is not numeric: {body[key]}"


@pytest.mark.asyncio
async def test_chambers_returns_200_list(viewer_client: AsyncClient) -> None:
    """GET /chambers returns 200 with a list (empty is fine for mock DB)."""
    resp = await viewer_client.get("/api/v1/chambers")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_stats_unauthenticated_returns_401(client: AsyncClient) -> None:
    """GET /stats without token returns 401."""
    resp = await client.get("/api/v1/stats")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_chambers_unauthenticated_returns_401(client: AsyncClient) -> None:
    """GET /chambers without token returns 401."""
    resp = await client.get("/api/v1/chambers")
    assert resp.status_code == 401
