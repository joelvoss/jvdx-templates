import json
import logging

from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError
from starlette.requests import Request

from src.utils.exception_handlers import (
    handle_general_exception,
    handle_http_exception,
    handle_validation_exception,
)

# //////////////////////////////////////////////////////////////////////////////
# Helpers


def make_request(path: str = "/test") -> Request:
    """
    Build a minimal Starlette Request for use in handler tests. FastAPI uses
    Starlette under the hood.
    """
    scope = {
        "type": "http",
        "method": "GET",
        "path": path,
        "query_string": b"",
        "headers": [],
    }
    return Request(scope)


def make_validation_exc(*field_errors: dict) -> RequestValidationError:
    """
    Build a RequestValidationError from raw error dicts.
    """
    return RequestValidationError(list(field_errors))


# //////////////////////////////////////////////////////////////////////////////
# handle_validation_exception


async def test_handle_validation_exception_returns_400():
    class M(BaseModel):
        x: int

    try:
        M(x="not-an-int")  # type: ignore[arg-type]
    except ValidationError as pydantic_err:
        exc = RequestValidationError(pydantic_err.errors())

    response = await handle_validation_exception(make_request("/validate"), exc)

    assert response.status_code == 400
    parsed = json.loads(response.body)
    assert parsed["code"] == 400
    assert isinstance(parsed["message"], list)


async def test_handle_validation_exception_strips_sensitive_input_from_log(caplog):
    """
    The summarised log must not contain the raw client value.
    """
    exc = make_validation_exc(
        {"loc": ("body", "x"), "type": "int_parsing", "input": "top-secret"}
    )
    with caplog.at_level(logging.ERROR, logger="app"):
        await handle_validation_exception(make_request(), exc)

    log_text = " ".join(r.getMessage() for r in caplog.records)
    assert "top-secret" not in log_text


async def test_handle_validation_exception_log_includes_loc_and_type(caplog):
    exc = make_validation_exc({"loc": ("body", "title"), "type": "missing"})
    with caplog.at_level(logging.ERROR, logger="app"):
        await handle_validation_exception(make_request(), exc)

    log_text = " ".join(r.getMessage() for r in caplog.records)
    assert "title" in log_text
    assert "missing" in log_text


async def test_handle_validation_exception_response_contains_summarized_errors():
    """
    The HTTP body must expose only loc and type, not raw client input.
    """
    exc = make_validation_exc(
        {"loc": ("body", "x"), "type": "missing", "input": "top-secret"}
    )
    response = await handle_validation_exception(make_request(), exc)
    parsed = json.loads(response.body)
    assert parsed["message"][0]["loc"] == ["body", "x"]
    assert parsed["message"][0]["type"] == "missing"
    assert "input" not in parsed["message"][0]


# //////////////////////////////////////////////////////////////////////////////
# handle_http_exception


async def test_handle_http_exception_returns_json_with_code_and_message():
    exc = HTTPException(status_code=403, detail="Forbidden")
    response = await handle_http_exception(make_request(), exc)

    assert response.status_code == 403
    parsed = json.loads(response.body)
    assert parsed["code"] == 403
    assert parsed["message"] == "Forbidden"


async def test_handle_http_exception_404_does_not_log(caplog):
    exc = HTTPException(status_code=404, detail="Not Found")
    with caplog.at_level(logging.ERROR, logger="app"):
        await handle_http_exception(make_request(), exc)
    # 404s are intentionally suppressed to avoid Cloud Logging spam
    assert not any("404" in r.message for r in caplog.records)


async def test_handle_http_exception_500_logs_error(caplog):
    exc = HTTPException(status_code=500, detail="Boom")
    with caplog.at_level(logging.ERROR, logger="app"):
        await handle_http_exception(make_request(), exc)
    assert any(r.levelno == logging.ERROR for r in caplog.records)


async def test_handle_http_exception_no_body_for_204():
    from starlette.responses import Response

    exc = HTTPException(status_code=204, detail="No Content")
    response = await handle_http_exception(make_request(), exc)
    assert isinstance(response, Response)
    assert response.status_code == 204
    # 204 must not have a body
    assert response.body == b""


async def test_handle_http_exception_no_body_for_304():
    exc = HTTPException(status_code=304, detail="Not Modified")
    response = await handle_http_exception(make_request(), exc)
    assert response.status_code == 304
    assert response.body == b""


async def test_handle_http_exception_forwards_custom_headers():
    exc = HTTPException(
        status_code=401,
        detail="Unauthorized",
        headers={"WWW-Authenticate": "Bearer"},
    )
    response = await handle_http_exception(make_request(), exc)
    assert response.status_code == 401
    assert response.headers.get("www-authenticate") == "Bearer"


# //////////////////////////////////////////////////////////////////////////////
# handle_general_exception


async def test_handle_general_exception_returns_500_without_leaking_details(caplog):
    exc = RuntimeError("top secret internal detail")
    with caplog.at_level(logging.ERROR, logger="app"):
        response = await handle_general_exception(make_request(), exc)

    assert response.status_code == 500
    parsed = json.loads(response.body)
    assert parsed["code"] == 500
    assert parsed["message"] == "Internal Server Error"
    # The internal message must NOT appear in the HTTP response
    assert "top secret" not in response.body.decode()


async def test_handle_general_exception_logs_the_original_error(caplog):
    exc = ValueError("something broke")
    with caplog.at_level(logging.ERROR, logger="app"):
        await handle_general_exception(make_request(), exc)
    assert any(r.levelno == logging.ERROR for r in caplog.records)
