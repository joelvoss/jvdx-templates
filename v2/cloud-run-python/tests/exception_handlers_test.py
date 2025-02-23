import pytest
from fastapi import FastAPI, HTTPException, Response
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from src.utils.exception_handlers import (
    handle_general_exception,
    handle_http_exception,
    handle_validation_exception,
)


def test_handle_validation_exception():
    # Setup
    def handler(_: Response):
        raise RequestValidationError(errors=["foo", "bar"], body="body")

    app = FastAPI(
        routes=[APIRoute("/", handler)],
        exception_handlers={
            RequestValidationError: handle_validation_exception,
        },
    )

    client = TestClient(app)

    response = client.get("/")

    # Assertions
    assert response.status_code == 400
    assert response.json() == {"message": ["foo", "bar"]}


def test_handle_http_exception():
    # Setup
    def handler(_: Response):
        raise HTTPException(
            status_code=404,
            detail="foo",
            headers={"X-Custom-Header": "value"},
        )

    app = FastAPI(
        routes=[APIRoute("/", handler)],
        exception_handlers={
            HTTPException: handle_http_exception,
        },
    )

    client = TestClient(app)

    response = client.get("/")

    # Assertions
    assert response.status_code == 404
    assert response.json() == {"message": "foo"}
    assert response.headers["X-Custom-Header"] == "value"


def test_handle_general_exception():
    # Setup
    def handler(_: Response):
        raise HTTPException(
            status_code=404,
            detail="foo",
            headers={"X-Custom-Header": "value"},
        )

    app = FastAPI(
        routes=[APIRoute("/", handler)],
        exception_handlers={
            # FastAPI/Starlette raises "real" exceptions again, so we use the
            # general exception handler to catch a HTTPEXception.
            404: handle_general_exception,
        },
    )

    client = TestClient(app)

    response = client.get("/")

    # Assertions
    assert response.status_code == 500
    assert response.json() == {"message": "404: foo"}


@pytest.mark.anyio
async def test_handle_general_exception_2():
    # Setup
    response = await handle_general_exception(None, Exception("foo"))

    # Assertions
    assert response.status_code == 500
    assert response.body == b'{"message":"foo"}'
