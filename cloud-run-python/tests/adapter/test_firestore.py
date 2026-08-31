from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.adapter import firestore


def test_init_client_creates_async_client():
    client = MagicMock()
    with patch("src.adapter.firestore.firestore.AsyncClient", return_value=client):
        assert firestore.init_client() is client


@pytest.mark.asyncio
async def test_close_client_closes_client():
    client = MagicMock()
    await firestore.close_client(client)
    client.close.assert_called_once_with()


@pytest.mark.asyncio
async def test_check_connection_reads_one_document():
    client = MagicMock()
    client.collection.return_value.limit.return_value.get = AsyncMock()
    await firestore.check_connection(client)
    client.collection.assert_called_once_with("books")
    client.collection.return_value.limit.assert_called_once_with(1)
