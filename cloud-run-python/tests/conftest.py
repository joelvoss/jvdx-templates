"""Shared pytest fixtures for the test suite."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from src.runtime import create_runtime


@pytest.fixture
def mock_firestore_client() -> MagicMock:
    """Return a fresh MagicMock Firestore client for each test."""
    return MagicMock()


@pytest.fixture
def app(mock_firestore_client: MagicMock):
    """
    Create the FastAPI application with Firestore fully mocked out.

    Patches init_client, get_client, and close_client so no GCP credentials
    are required and the lifespan runs cleanly in tests.
    """
    with (
        patch("src.adapter.firestore.init_client", return_value=mock_firestore_client),
        patch("src.adapter.firestore.check_connection", new=AsyncMock()),
        patch("src.adapter.firestore.close_client", new=AsyncMock()),
    ):
        application = create_runtime()
        application.state.firestore_client = mock_firestore_client
        yield application


@pytest.fixture
async def async_client(app):
    """Async HTTP client wired to the test app via ASGI transport."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client
