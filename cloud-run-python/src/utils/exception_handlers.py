import logging

from fastapi import HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("app")


async def handle_validation_exception(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Handle validation exceptions raised by Pydantic/FastAPI request parsing.

    Args:
        _ (Request): The request object.
        exc (RequestValidationError): The validation error object.
    Returns:
        JSONResponse: Response with code and message.
    """
    logger.error("Handled validation error: %s", exc.errors())
    return JSONResponse(
        content={"code": status.HTTP_400_BAD_REQUEST, "message": exc.errors()},
        status_code=status.HTTP_400_BAD_REQUEST,
    )


async def handle_http_exception(_: Request, exc: HTTPException) -> Response:
    """
    Handle HTTPExceptions raised in our API. This includes 404, 500, and any
    other non-validation exceptions.

    Args:
        _ (Request): The request object.
        exc (HTTPException): The exception object.
    Returns:
        Response: Response with code and message.
    """
    headers = getattr(exc, "headers", None)
    status_code = getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
    body_allowed = not (status_code < 200 or status_code in {204, 205, 304})
    # NOTE: Don't log 404 errors, as they might spam Cloud Logging.
    if status_code != 404:
        logger.error("Handled HTTP error: %s", exc)
    if not body_allowed:
        return Response(status_code=status_code, headers=headers)
    return JSONResponse(
        content={"code": status_code, "message": exc.detail},
        status_code=status_code,
        headers=headers,
    )


async def handle_general_exception(_: Request, exc: Exception) -> Response:
    """
    Catch-all handler for unhandled exceptions. Returns a generic 500 response
    without leaking internal error details to callers.

    Args:
        _ (Request): The request object.
        exc (Exception): The exception object.
    Returns:
        Response: Response with code and message.
    """
    logger.error("Handled server error: %s", exc)
    return JSONResponse(
        content={"code": 500, "message": "Internal Server Error"},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
