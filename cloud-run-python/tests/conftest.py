"""Pytest configuration file for the tests."""

import pytest


@pytest.fixture
def anyio_backend():
    """
    Return the name of the asyncio backend to use for async tests.

    Returns:
        str: Name of the asyncio backend
    """
    return "asyncio"
