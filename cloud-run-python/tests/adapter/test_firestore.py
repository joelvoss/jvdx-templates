from unittest.mock import MagicMock, patch

import pytest

from src.adapter import firestore as fs


@pytest.fixture(autouse=True)
def reset_global_client():
    """
    Reset the module-level client to None before and after every test.
    """
    original = fs.client
    fs.client = None
    yield
    fs.client = original


# //////////////////////////////////////////////////////////////////////////////
# init_client


def test_init_client_creates_new_async_client():
    mock_instance = MagicMock()
    with patch(
        "src.adapter.firestore.firestore.AsyncClient", return_value=mock_instance
    ):
        result = fs.init_client()
    assert result is mock_instance
    assert fs.client is mock_instance


def test_init_client_returns_existing_client_without_creating_new_one():
    existing = MagicMock()
    fs.client = existing
    with patch("src.adapter.firestore.firestore.AsyncClient") as mock_cls:
        result = fs.init_client()
    mock_cls.assert_not_called()
    assert result is existing


# //////////////////////////////////////////////////////////////////////////////
# get_client


def test_get_client_returns_initialized_client():
    mock_instance = MagicMock()
    fs.client = mock_instance
    assert fs.get_client() is mock_instance


def test_get_client_raises_runtime_error_when_not_initialized():
    with pytest.raises(RuntimeError, match="Firestore client is not initialized"):
        fs.get_client()


# //////////////////////////////////////////////////////////////////////////////
# close_client


def test_close_client_calls_close_and_resets_to_none():
    mock_instance = MagicMock()
    fs.client = mock_instance
    fs.close_client()
    mock_instance.close.assert_called_once()
    assert fs.client is None


def test_close_client_is_noop_when_client_is_none():
    fs.close_client()  # must not raise
    assert fs.client is None
