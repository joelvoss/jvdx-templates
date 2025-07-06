import uvicorn
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.routes import books
from src.settings import settings
from src.utils.cloud_logging import CloudLogginMiddleware
from src.utils.exception_handlers import (
    handle_general_exception,
    handle_http_exception,
    handle_validation_exception,
)
from src.utils.secure_headers import SecureHeadersMiddleware

app = FastAPI(
    title=settings.NAME,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    # NOTE: Custom exception handlers that produce JSON responses in our format.
    exception_handlers={
        404: handle_http_exception,
        500: handle_general_exception,
        RequestValidationError: handle_validation_exception,
        HTTPException: handle_http_exception,
    },
)


# NOTE: Add middleware to extract Google Cloud Logging trace ID, span ID, and
# trace sample decision from the incoming request headers.
app.add_middleware(CloudLogginMiddleware)

# NOTE: Add middleware to set secure headers
app.add_middleware(SecureHeadersMiddleware)

# NOTE: Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# NOTE: Health check route
@app.get("/", tags=["health"])
async def health() -> JSONResponse:
    """
    Health check.

    Returns:
        JSONResponse:
            The response object with the message "ok" and status code 200.
    """
    return JSONResponse({"message": "ok"}, status_code=200)


# NOTE: Routes of our API (prefixed by version)
router = APIRouter()
router.include_router(books.router)
app.include_router(router, prefix=settings.API_V1_PREFIX)

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        workers=settings.WORKERS,
        log_config={
            "version": 1,
            "disable_existing_loggers": True,
            "formatters": {
                "default": {
                    "()": "src.utils.cloud_logging.CloudLogginFormatter",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "loggers": {
                "app": {"handlers": ["default"], "level": "DEBUG", "propagate": False},
                "uvicorn": {
                    "handlers": ["default"],
                    "level": "INFO",
                    "propagate": False,
                },
                "uvicorn.error": {"level": "INFO"},
                "uvicorn.access": {"level": "INFO"},
            },
        },
        access_log=False,
        server_header=False,
    )
