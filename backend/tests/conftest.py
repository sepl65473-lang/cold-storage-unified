"""Shared test fixtures — no real DB or network required."""
from __future__ import annotations

import uuid
from types import SimpleNamespace
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.auth.jwt import create_access_token
from app.auth.security import get_password_hash
from app.db.session import get_db
from app.dependencies import get_current_user
from app.main import app
from app.models.user import UserRole

# ── Fixed IDs so all tests share the same org/users ──────────────────────────
TEST_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
TEST_USER_IDS = {
    UserRole.VIEWER:     uuid.UUID("00000000-0000-0000-0000-000000000010"),
    UserRole.OPERATOR:   uuid.UUID("00000000-0000-0000-0000-000000000020"),
    UserRole.ADMIN:      uuid.UUID("00000000-0000-0000-0000-000000000030"),
    UserRole.SUPERADMIN: uuid.UUID("00000000-0000-0000-0000-000000000040"),
}


def make_user(role: str, password: str = "Test1234!") -> SimpleNamespace:
    """
    Build a plain SimpleNamespace that behaves like a User ORM object.
    Avoids SQLAlchemy descriptor issues in unit tests.
    """
    return SimpleNamespace(
        id=TEST_USER_IDS[role],
        organization_id=TEST_ORG_ID,
        email=f"{role}@test.smaatech.com",
        email_encrypted=f"{role}@test.smaatech.com",
        password_hash=get_password_hash(password),
        role=role,
        is_active=True,
        mfa_enabled=False,
        mfa_secret_encrypted=None,
        last_login=None,
    )


def make_token(role: str) -> str:
    """Create a real, signed JWT for the given role."""
    return create_access_token(TEST_USER_IDS[role], TEST_ORG_ID, role)


def mock_db_returning(user: SimpleNamespace | None) -> AsyncMock:
    """
    Returns a mock AsyncSession whose execute() returns user via scalar_one_or_none().
    Covers the login endpoint's DB lookup pattern.
    """
    scalar_result = MagicMock()
    scalar_result.scalar_one_or_none.return_value = user

    session = AsyncMock()
    session.execute = AsyncMock(return_value=scalar_result)
    session.commit = AsyncMock()
    session.add = MagicMock()
    return session


def mock_db_empty() -> AsyncMock:
    """DB session that returns empty results for all queries."""
    scalar_result = MagicMock()
    scalar_result.scalar_one_or_none.return_value = None
    scalar_result.scalars.return_value.all.return_value = []
    scalar_result.scalar_one.return_value = 0

    session = AsyncMock()
    session.execute = AsyncMock(return_value=scalar_result)
    session.commit = AsyncMock()
    session.add = MagicMock()
    session.refresh = AsyncMock()
    return session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Plain httpx client — no auth, no DB override."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def viewer_client() -> AsyncGenerator[AsyncClient, None]:
    """Client authenticated as VIEWER (read-only)."""
    user = make_user(UserRole.VIEWER)
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: mock_db_empty()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def operator_client() -> AsyncGenerator[AsyncClient, None]:
    """Client authenticated as OPERATOR (read + control)."""
    user = make_user(UserRole.OPERATOR)
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: mock_db_empty()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_client() -> AsyncGenerator[AsyncClient, None]:
    """Client authenticated as ADMIN (full access)."""
    user = make_user(UserRole.ADMIN)
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: mock_db_empty()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()
