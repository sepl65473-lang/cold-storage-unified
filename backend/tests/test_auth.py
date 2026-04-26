"""Login success / failure tests — Phase 7."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.db.session import get_db
from app.main import app
from app.models.user import UserRole
from tests.conftest import make_user, mock_db_returning, mock_db_empty


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    """Valid credentials return 200 with access_token."""
    user = make_user(UserRole.ADMIN, password="Test1234!")
    app.dependency_overrides[get_db] = lambda: mock_db_returning(user)

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "Test1234!"},
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient) -> None:
    """Correct email but wrong password returns 401."""
    user = make_user(UserRole.ADMIN, password="Test1234!")
    app.dependency_overrides[get_db] = lambda: mock_db_returning(user)

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "WrongPassword!"},
    )

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient) -> None:
    """Unknown email returns 401 (not 404, to avoid user enumeration)."""
    app.dependency_overrides[get_db] = lambda: mock_db_returning(None)

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@smaatech.com", "password": "Test1234!"},
    )

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient) -> None:
    """Deactivated account returns 401 even with correct password."""
    user = make_user(UserRole.VIEWER, password="Test1234!")
    user.is_active = False
    app.dependency_overrides[get_db] = lambda: mock_db_returning(user)

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "Test1234!"},
    )

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_missing_fields(client: AsyncClient) -> None:
    """Request with missing email/password fields returns 422."""
    app.dependency_overrides[get_db] = lambda: mock_db_empty()

    resp = await client.post("/api/v1/auth/login", json={"email": "only@email.com"})

    assert resp.status_code == 422
