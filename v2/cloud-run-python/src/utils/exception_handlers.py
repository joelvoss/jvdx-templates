import logging

from fastapi import HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("app")


async def handle_validation_exception(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Handle validation exceptions.

    Args:
        _ (Request):
            The request object.
        exc (RequestValidationError):
            The validation error object.
    Returns:
        JSONResponse:
            The reponse object with the exception message and status code.
    """
    logger.error(f"Handled validation error: {exc.errors()}")
    return JSONResponse(
        content={"message": exc.errors()},
        status_code=status.HTTP_400_BAD_REQUEST,
    )


async def handle_http_exception(_: Request, exc: HTTPException) -> Response:
    """
    Handle exceptions. We use a single exception handler for all exceptions
    raised in our API. This includes 404, 500, and any other non-validation
    exceptions that may be raised.

    Args:
        _ (Request):
            The request object.
        exc (HTTPException):
            The exception object.
    Returns:
        Response:
            The reponse object with the exception message and status code.
    """
    headers = getattr(exc, "headers", None)
    status_code = getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
    body_allowed = not (status_code < 200 or status_code in {204, 205, 304})
    # NOTE: Don't log 404 errors, as they might spam Cloud Logging.
    if status_code != 404:
        logger.error(f"Handled HTTP error: {str(exc)}")
    if not body_allowed:
        return Response(status_code=status_code, headers=headers)
    return JSONResponse(
        content={"message": exc.detail},
        status_code=status_code,
        headers=headers,
    )


async def handle_general_exception(_: Request, exc: Exception) -> Response:
    """
    Handle exceptions. We use a single exception handler for all exceptions
    raised in our API. This includes 404, 500, and any other non-validation
    exceptions that may be raised.

    Args:
        _ (Request):
            The request object.
        exc (Exception):
            The exception object.
    Returns:
        Response:
            The reponse object with the exception message and status code.
    """
    logger.error(f"Handled server error: {str(exc)}")
    return JSONResponse(
        content={"message": str(exc)},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
