from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.modules.books import (
    Book,
    BookList,
    BookNotFound,
    CreateBook,
    UpdateBook,
    create_book,
    delete_book,
    get_book,
    list_books,
    update_book,
)

# //////////////////////////////////////////////////////////////////////////////
# Helpers


def make_doc(doc_id: str, data: dict, *, exists: bool = True) -> MagicMock:
    """
    Build a Firestore document snapshot mock.
    """
    doc = MagicMock()
    doc.id = doc_id
    doc.exists = exists
    doc.to_dict.return_value = data if exists else None
    return doc


async def async_gen(items):
    """
    Yield items as an async generator (used to mock collection.stream()).
    """
    for item in items:
        yield item


def make_doc_ref(doc_mock: MagicMock | None = None) -> MagicMock:
    """
    Build a Firestore document reference mock with async methods.
    """
    ref = MagicMock()
    ref.get = AsyncMock(return_value=doc_mock or MagicMock())
    ref.set = AsyncMock()
    ref.update = AsyncMock()
    ref.delete = AsyncMock()
    return ref


@pytest.fixture
def mock_client() -> MagicMock:
    return MagicMock()


@pytest.fixture(autouse=True)
def patch_firestore(mock_client: MagicMock):
    with patch("src.adapter.firestore.get_client", return_value=mock_client):
        yield


# //////////////////////////////////////////////////////////////////////////////
# list_books


async def test_list_books_returns_empty_list(mock_client: MagicMock):
    mock_client.collection.return_value.stream.return_value = async_gen([])
    result = await list_books()
    assert result == BookList(books=[], total=0)


async def test_list_books_returns_all_books(mock_client: MagicMock):
    docs = [
        make_doc("1", {"title": "Book One", "author": "Alice"}),
        make_doc("2", {"title": "Book Two", "author": "Bob"}),
    ]
    mock_client.collection.return_value.stream.return_value = async_gen(docs)
    result = await list_books()
    assert result.total == 2
    assert result.books[0] == Book(id="1", title="Book One", author="Alice")
    assert result.books[1] == Book(id="2", title="Book Two", author="Bob")


async def test_list_books_uses_empty_string_for_missing_fields(mock_client: MagicMock):
    mock_client.collection.return_value.stream.return_value = async_gen(
        [make_doc("1", {})]
    )
    result = await list_books()
    assert result.books[0] == Book(id="1", title="", author="")


# //////////////////////////////////////////////////////////////////////////////
# get_book


async def test_get_book_returns_book_when_found(mock_client: MagicMock):
    doc = make_doc("abc", {"title": "Found", "author": "Author"})
    mock_client.collection.return_value.document.return_value.get = AsyncMock(
        return_value=doc
    )
    result = await get_book("abc")
    assert result == Book(id="abc", title="Found", author="Author")
    mock_client.collection.return_value.document.assert_called_once_with("abc")


async def test_get_book_raises_book_not_found_when_missing(mock_client: MagicMock):
    doc = make_doc("missing", {}, exists=False)
    mock_client.collection.return_value.document.return_value.get = AsyncMock(
        return_value=doc
    )
    with pytest.raises(BookNotFound) as exc_info:
        await get_book("missing")
    assert exc_info.value.book_id == "missing"
    assert "missing" in str(exc_info.value)


# //////////////////////////////////////////////////////////////////////////////
# create_book


async def test_create_book_with_explicit_title_and_author(mock_client: MagicMock):
    doc_ref = make_doc_ref()
    mock_client.document.return_value = doc_ref

    payload = CreateBook(title="My Title", author="My Author")
    result = await create_book(payload)

    assert result.title == "My Title"
    assert result.author == "My Author"
    assert result.id  # a UUID was generated
    doc_ref.set.assert_called_once()


async def test_create_book_generates_defaults_when_title_and_author_are_none(
    mock_client: MagicMock,
):
    doc_ref = make_doc_ref()
    mock_client.document.return_value = doc_ref

    result = await create_book(CreateBook())

    assert result.title.startswith("Title ")
    assert result.author.startswith("Author ")


async def test_create_book_generates_unique_ids(mock_client: MagicMock):
    doc_ref = make_doc_ref()
    mock_client.document.return_value = doc_ref

    r1 = await create_book(CreateBook(title="Book", author="Author"))
    r2 = await create_book(CreateBook(title="Book", author="Author"))
    assert r1.id != r2.id


async def test_create_book_persists_to_firestore(mock_client: MagicMock):
    doc_ref = make_doc_ref()
    mock_client.document.return_value = doc_ref

    result = await create_book(CreateBook(title="T", author="A"))

    mock_client.document.assert_called_once_with("books", result.id)
    doc_ref.set.assert_called_once_with(result.model_dump())


# //////////////////////////////////////////////////////////////////////////////
# update_book


async def test_update_book_applies_field_updates(mock_client: MagicMock):
    existing = make_doc("abc", {"title": "Old Title", "author": "Old Author"})
    doc_ref = make_doc_ref(existing)
    mock_client.document.return_value = doc_ref

    result = await update_book("abc", UpdateBook(title="New Title"))

    assert result.title == "New Title"
    assert result.author == "Old Author"
    doc_ref.update.assert_called_once_with({"title": "New Title"})


async def test_update_book_skips_firestore_write_when_payload_is_empty(
    mock_client: MagicMock,
):
    existing = make_doc("abc", {"title": "Title", "author": "Author"})
    doc_ref = make_doc_ref(existing)
    mock_client.document.return_value = doc_ref

    result = await update_book("abc", UpdateBook())

    doc_ref.update.assert_not_called()
    assert result.title == "Title"
    assert result.author == "Author"


async def test_update_book_id_field_in_stored_doc_does_not_cause_error(
    mock_client: MagicMock,
):
    # Firestore stores `id` in the document body (from book.model_dump()); the
    # update function must not pass it as a duplicate keyword to Book().
    existing = make_doc("abc", {"id": "abc", "title": "Title", "author": "Author"})
    doc_ref = make_doc_ref(existing)
    mock_client.document.return_value = doc_ref

    result = await update_book("abc", UpdateBook())
    assert result.id == "abc"


async def test_update_book_raises_book_not_found_when_missing(mock_client: MagicMock):
    missing = make_doc("xyz", {}, exists=False)
    doc_ref = make_doc_ref(missing)
    mock_client.document.return_value = doc_ref

    with pytest.raises(BookNotFound) as exc_info:
        await update_book("xyz", UpdateBook(title="New"))
    assert exc_info.value.book_id == "xyz"


# //////////////////////////////////////////////////////////////////////////////
# delete_book


async def test_delete_book_calls_firestore_delete(mock_client: MagicMock):
    doc_ref = make_doc_ref()
    mock_client.document.return_value = doc_ref

    await delete_book("abc")

    mock_client.document.assert_called_once_with("books", "abc")
    doc_ref.delete.assert_called_once()


async def test_delete_book_succeeds_even_when_book_does_not_exist(
    mock_client: MagicMock,
):
    # delete() in Firestore is a no-op for non-existent documents; the
    # module should not raise in this case.
    doc_ref = make_doc_ref()
    mock_client.document.return_value = doc_ref

    await delete_book("non-existent")  # must not raise
    doc_ref.delete.assert_called_once()


# //////////////////////////////////////////////////////////////////////////////
# BookNotFound


def test_book_not_found_stores_book_id():
    exc = BookNotFound("42")
    assert exc.book_id == "42"


def test_book_not_found_message_contains_id():
    exc = BookNotFound("42")
    assert "42" in str(exc)
