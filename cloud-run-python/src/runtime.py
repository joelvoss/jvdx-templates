from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.adapter import firestore
from src.routes import books
from src.settings import Settings, settings
from src.utils.cloud_logging import CloudLoggingMiddleware
from src.utils.exception_handlers import (
    handle_general_exception,
    handle_http_exception,
    handle_validation_exception,
)
from src.utils.secure_headers import SecureHeadersMiddleware


def create_runtime(runtime_settings: Settings | None = None) -> FastAPI:
    """
    Factory function to create and configure the FastAPI app.
    This function initializes the FastAPI app, sets up middleware, exception
    handlers, and includes API routes. It also manages the lifespan of the app,
    ensuring that the Firestore database connection is properly initialized and
    closed.

    Args:
        runtime_settings (Settings | None): Optional settings to override the default settings.
    Returns:
        FastAPI: The configured FastAPI app instance.
    """
    active_settings = runtime_settings or settings

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        firestore.init_client()
        try:
            yield
        finally:
            firestore.close_client()

    app = FastAPI(
        title=active_settings.NAME,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
        exception_handlers={
            404: handle_http_exception,
            500: handle_general_exception,
            RequestValidationError: handle_validation_exception,
            HTTPException: handle_http_exception,
        },
    )

    app.add_middleware(CloudLoggingMiddleware)
    app.add_middleware(SecureHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["health"])
    async def health() -> JSONResponse:
        return JSONResponse({"message": "ok"}, status_code=200)

    router = APIRouter()
    router.include_router(books.router)
    app.include_router(router, prefix=active_settings.API_V1_PREFIX)

    return app
