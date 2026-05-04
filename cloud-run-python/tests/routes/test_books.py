"""
Integration-style tests. The Firestore adapter is mocked at the module function
level so each test only exercises the HTTP layer in isolation.
"""

from unittest.mock import AsyncMock, patch

import pytest

from src.modules.books import Book, BookList, BookNotFound

# //////////////////////////////////////////////////////////////////////////////
# security headers expected on every response

SECURITY_HEADERS = {
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-DNS-Prefetch-Control": "off",
    "X-Download-Options": "noopen",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Permitted-Cross-Domain-Policies": "none",
}


# //////////////////////////////////////////////////////////////////////////////
# GET /


async def test_health_check_returns_ok(async_client):
    response = await async_client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "ok"}


# //////////////////////////////////////////////////////////////////////////////
# GET /v1/books


async def test_list_books_returns_empty_list(async_client):
    with patch(
        "src.modules.books.list_books",
        new=AsyncMock(return_value=BookList(books=[], total=0)),
    ):
        response = await async_client.get("/v1/books")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["books"] == []


async def test_list_books_returns_all_books(async_client):
    books = [
        Book(id="1", title="Book One", author="Alice"),
        Book(id="2", title="Book Two", author="Bob"),
    ]
    with patch(
        "src.modules.books.list_books",
        new=AsyncMock(return_value=BookList(books=books, total=2)),
    ):
        response = await async_client.get("/v1/books")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["books"][0]["id"] == "1"
    assert body["books"][1]["title"] == "Book Two"


# //////////////////////////////////////////////////////////////////////////////
# POST /v1/books


async def test_create_book_returns_created_book(async_client):
    new_book = Book(id="new-id", title="New Book", author="New Author")
    with patch(
        "src.modules.books.create_book",
        new=AsyncMock(return_value=new_book),
    ):
        response = await async_client.post(
            "/v1/books", json={"title": "New Book", "author": "New Author"}
        )
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "new-id"
    assert body["title"] == "New Book"


async def test_create_book_with_empty_body_uses_defaults(async_client):
    default_book = Book(id="gen-id", title="Title gen-id", author="Author gen-id")
    with patch(
        "src.modules.books.create_book",
        new=AsyncMock(return_value=default_book),
    ):
        response = await async_client.post("/v1/books", json={})
    assert response.status_code == 200
    assert response.json()["id"] == "gen-id"


# //////////////////////////////////////////////////////////////////////////////
# GET /v1/books/{id}


async def test_get_book_returns_book(async_client):
    book = Book(id="abc", title="Found", author="Author")
    with patch(
        "src.modules.books.get_book",
        new=AsyncMock(return_value=book),
    ):
        response = await async_client.get("/v1/books/abc")
    assert response.status_code == 200
    assert response.json()["id"] == "abc"


async def test_get_book_returns_404_when_not_found(async_client):
    with patch(
        "src.modules.books.get_book",
        new=AsyncMock(side_effect=BookNotFound("missing")),
    ):
        response = await async_client.get("/v1/books/missing")
    assert response.status_code == 404
    body = response.json()
    assert body["code"] == 404
    assert "missing" in body["message"]


# //////////////////////////////////////////////////////////////////////////////
# PATCH /v1/books/{id}


async def test_update_book_returns_updated_book(async_client):
    updated = Book(id="abc", title="Updated", author="Same Author")
    with patch(
        "src.modules.books.update_book",
        new=AsyncMock(return_value=updated),
    ):
        response = await async_client.patch("/v1/books/abc", json={"title": "Updated"})
    assert response.status_code == 200
    assert response.json()["title"] == "Updated"


async def test_update_book_returns_404_when_not_found(async_client):
    with patch(
        "src.modules.books.update_book",
        new=AsyncMock(side_effect=BookNotFound("gone")),
    ):
        response = await async_client.patch("/v1/books/gone", json={"title": "X"})
    assert response.status_code == 404
    body = response.json()
    assert body["code"] == 404
    assert "gone" in body["message"]


# //////////////////////////////////////////////////////////////////////////////
# DELETE /v1/books/{id}


async def test_delete_book_returns_200(async_client):
    with patch(
        "src.modules.books.delete_book",
        new=AsyncMock(return_value=None),
    ):
        response = await async_client.delete("/v1/books/abc")
    assert response.status_code == 200


# //////////////////////////////////////////////////////////////////////////////
# Security: docs endpoints disabled


@pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
async def test_api_docs_endpoints_are_disabled(async_client, path):
    response = await async_client.get(path)
    assert response.status_code == 404


# //////////////////////////////////////////////////////////////////////////////
# Security: response headers


async def test_security_headers_present_on_every_response(async_client):
    with patch(
        "src.modules.books.list_books",
        new=AsyncMock(return_value=BookList(books=[], total=0)),
    ):
        response = await async_client.get("/v1/books")
    for header, value in SECURITY_HEADERS.items():
        assert response.headers.get(header) == value, (
            f"Expected {header}: {value}, got {response.headers.get(header)!r}"
        )


async def test_x_powered_by_header_is_absent(async_client):
    response = await async_client.get("/")
    assert "x-powered-by" not in response.headers


async def test_security_headers_present_on_404_responses(async_client):
    response = await async_client.get("/does-not-exist")
    for header in SECURITY_HEADERS:
        assert header in response.headers


# //////////////////////////////////////////////////////////////////////////////
# Security: CORS


async def test_cors_allows_configured_origins(async_client):
    response = await async_client.get("/", headers={"Origin": "http://example.com"})
    # Default CORS_ORIGINS = ["*"] so any origin is reflected
    assert response.headers.get("access-control-allow-origin") in (
        "*",
        "http://example.com",
    )


async def test_cors_preflight_returns_200(async_client):
    response = await async_client.options(
        "/",
        headers={
            "Origin": "http://example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
