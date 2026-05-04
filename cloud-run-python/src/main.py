import uvicorn

from src.runtime import create_runtime
from src.settings import settings

# Create the FastAPI app using the runtime factory function
app = create_runtime()

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
                    "()": "src.utils.cloud_logging.CloudLoggingFormatter",
                    "project": settings.PROJECT,
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
