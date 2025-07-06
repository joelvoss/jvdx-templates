import pytest
from fastapi import HTTPException
from google.cloud.exceptions import NotFound
from google.cloud.firestore import AsyncClient, DocumentSnapshot

from src.db import firestore


@pytest.mark.anyio
async def test_get_books(mocker):
    # Mock Firestore AsyncClient
    mock_db = mocker.AsyncMock(spec=AsyncClient)
    mock_collection = mock_db.collection.return_value
    mock_stream = mock_collection.stream.return_value

    # Create mock document snapshots
    mock_doc1 = mocker.create_autospec(DocumentSnapshot)
    mock_doc1.id = "1"
    mock_doc1.to_dict.return_value = {
        "id": mock_doc1.id,
        "title": "Book 1",
        "author": "Author 1",
    }

    mock_doc2 = mocker.create_autospec(DocumentSnapshot)
    mock_doc2.id = "2"
    mock_doc2.to_dict.return_value = {
        "id": mock_doc2.id,
        "title": "Book 2",
        "author": "Author 2",
    }

    # Set the return value of the stream method
    mock_stream.__aiter__.return_value = [mock_doc1, mock_doc2]

    # Patch the firestore.AsyncClient to use the mock
    mocker.patch("src.db.firestore.db", mock_db)
    books = await firestore.get_books()

    # Assertions
    assert len(books) == 2
    assert books[0] == firestore.Book(id="1", title="Book 1", author="Author 1")
    assert books[1] == firestore.Book(id="2", title="Book 2", author="Author 2")
    mock_db.collection.assert_called_once_with("books")

    mocker.resetall()


@pytest.mark.anyio
async def test_get_books_empty(mocker):
    # Mock Firestore AsyncClient
    mock_db = mocker.AsyncMock(spec=AsyncClient)
    mock_collection = mock_db.collection.return_value
    mock_stream = mock_collection.stream.return_value

    # Set the return value of the stream method to an empty list
    mock_stream.__aiter__.return_value = []

    # Patch the firestore.AsyncClient to use the mock
    mocker.patch("src.db.firestore.db", mock_db)
    books = await firestore.get_books()

    # Assertions
    assert len(books) == 0
    mock_db.collection.assert_called_once_with("books")

    mocker.resetall()


# /////////////////////////////////////////////////////////////////////////////


@pytest.mark.anyio
async def test_get_book(mocker):
    # Mock Firestore AsyncClient
    mock_db = mocker.AsyncMock(spec=AsyncClient)
    mock_collection = mock_db.collection.return_value
    mock_document = mock_collection.document.return_value
    mock_document.get = mocker.AsyncMock()

    # Create a mock document snapshot
    mock_doc = mocker.create_autospec(DocumentSnapshot)
    mock_doc.id = "1"
    mock_doc.to_dict.return_value = {
        "id": mock_doc.id,
        "title": "Book 1",
        "author": "Author 1",
    }

    mock_document.get.return_value = mock_doc

    # Patch the firestore.AsyncClient to use the mock
    mocker.patch("src.db.firestore.db", mock_db)
    book = await firestore.get_book("1")

    # Assertions
    assert book == firestore.Book(id="1", title="Book 1", author="Author 1")
    mock_db.collection.assert_called_once_with("books")
    mock_collection.document.assert_called_once_with("1")

    mocker.resetall()


@pytest.mark.anyio
async def test_get_book_not_found(mocker):
    # Mock Firestore AsyncClient
    mock_db = mocker.AsyncMock(spec=AsyncClient)
    mock_collection = mock_db.collection.return_value
    mock_document = mock_collection.document.return_value
    mock_document.get = mocker.AsyncMock()

    # Create a mock document snapshot
    mock_doc = mocker.create_autospec(DocumentSnapshot)
    mock_doc.exists = False

    mock_document.get.return_value = mock_doc

    # Patch the firestore.AsyncClient to use the mock
    mocker.patch("src.db.firestore.db", mock_db)

    with pytest.raises(HTTPException) as e:
        await firestore.get_book("unknown")

        # Assertions
        assert e.value.status_code == 404
        assert e.value.detail == "Book with ID 'unknown' not found."

    mock_db.collection.assert_called_once_with("books")
    mock_collection.document.assert_called_once_with("unknown")

    mocker.resetall()


@pytest.mark.anyio
async def test_create_book(mocker):
    # Mock Firestore AsyncClient
    mock_db = mocker.AsyncMock(spec=AsyncClient)
    mock_collection = mock_db.collection.return_value
    mock_document = mock_collection.document.return_value
    mock_document.set = mocker.AsyncMock()

    # Patch uuid.uuid4 to return a fixed value
    mocker.patch("uuid.uuid4", return_value="1234")

    # Patch the firestore.AsyncClient to use the mock
    mocker.patch("src.db.firestore.db", mock_db)

    # Create a new book payload
    new_book_payload = firestore.NewBook(title="New Book", author="New Author")

    # Call the create_book function
    result = await firestore.create_book(new_book_payload)

    # Assertions
    assert result is True
    mock_db.collection.assert_called_once_with("books")
    mock_collection.document.assert_called_once_with("1234")
    mock_document.set.assert_called_once_with(
        {
            "id": "1234",
            "title": "New Book",
            "author": "New Author",
        }
    )
    mocker.resetall()


@pytest.mark.anyio
async def test_update_book(mocker):
    # Mock Firestore AsyncClient
    mock_db = mocker.AsyncMock(spec=AsyncClient)
    mock_collection = mock_db.collection.return_value
    mock_document = mock_collection.document.return_value
    mock_document.update = mocker.AsyncMock()

    # Patch the firestore.AsyncClient to use the mock
    mocker.patch("src.db.firestore.db", mock_db)

    # Create an update book payload
    update_book_payload = firestore.UpdateBook(
        title="Updated Title", author="Updated Author"
    )

    # Call the update_book function
    result = await firestore.update_book("1", update_book_payload)

    # Assertions
    assert result is True
    mock_db.collection.assert_called_once_with("books")
    mock_collection.document.assert_called_once_with("1")
    mock_document.update.assert_called_once_with(
        {
            "title": update_book_payload.title,
            "author": update_book_payload.author,
        }
    )

    mocker.resetall()


@pytest.mark.anyio
async def test_update_book_empty(mocker):
    # Mock Firestore AsyncClient
    mock_db = mocker.AsyncMock(spec=AsyncClient)
    mock_collection = mock_db.collection.return_value
    mock_document = mock_collection.document.return_value
    mock_document.update = mocker.AsyncMock()

    # Raise a ValueError exception
    # See https://github.com/googleapis/python-firestore/blob/main/google/cloud/firestore_v1/_helpers.py#L945
    mock_document.update.side_effect = ValueError(
        "Cannot update with an empty document."
    )

    # Patch the firestore.AsyncClient to use the mock
    mocker.patch("src.db.firestore.db", mock_db)

    # Create an update book payload
    update_book_payload = firestore.UpdateBook()

    # Call the update_book function
    with pytest.raises(HTTPException) as e_info:
        await firestore.update_book("1", update_book_payload)

        # Assertions
        assert e_info.value.status_code == 400
        assert e_info.value.detail == "Cannot update with an empty document."

    mock_db.collection.assert_called_once_with("books")
    mock_collection.document.assert_called_once_with("1")
    mock_document.update.assert_called_once_with({})

    mocker.resetall()


@pytest.mark.anyio
async def test_update_book_not_found(mocker):
    # Mock Firestore AsyncClient
    mock_db = mocker.AsyncMock(spec=AsyncClient)
    mock_collection = mock_db.collection.return_value
    mock_document = mock_collection.document.return_value
    mock_document.update = mocker.AsyncMock()

    # Raise a NotFound exception
    # See https://cloud.google.com/python/docs/reference/firestore/latest/google.cloud.firestore_v1.async_document.AsyncDocumentReference#google_cloud_firestore_v1_async_document_AsyncDocumentReference_update
    mock_document.update.side_effect = NotFound(message="Document not found")

    # Patch the firestore.AsyncClient to use the mock
    mocker.patch("src.db.firestore.db", mock_db)

    # Create an update book payload
    update_book_payload = firestore.UpdateBook()

    # Call the update_book function
    with pytest.raises(HTTPException) as e_info:
        await firestore.update_book("not_found", update_book_payload)

        # Assertions
        assert e_info.value.status_code == 404
        assert e_info.value.detail == "Book with ID 'not_found' not found."

    mock_db.collection.assert_called_once_with("books")
    mock_collection.document.assert_called_once_with("not_found")
    mock_document.update.assert_called_once_with({})

    mocker.resetall()


@pytest.mark.anyio
async def test_delete_book(mocker):
    # Mock Firestore AsyncClient
    mock_db = mocker.AsyncMock(spec=AsyncClient)
    mock_collection = mock_db.collection.return_value
    mock_document = mock_collection.document.return_value
    mock_document.delete = mocker.AsyncMock()

    # Patch the firestore.AsyncClient to use the mock
    mocker.patch("src.db.firestore.db", mock_db)

    # Call the delete_book function
    result = await firestore.delete_book("1")

    # Assertions
    assert result is True
    mock_db.collection.assert_called_once_with("books")
    mock_collection.document.assert_called_once_with("1")
    mock_document.delete.assert_called_once()

    mocker.resetall()
