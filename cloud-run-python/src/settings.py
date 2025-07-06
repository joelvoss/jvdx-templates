from typing import Literal

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings.
    These settings are loaded from environment variables. If no environment variables are set, the default values are used.
    """

    model_config = SettingsConfigDict(
        env_ignore_empty=True,
        extra="ignore",
    )

    PYTHON_ENV: Literal["development", "production"] = "development"

    NAME: str = "cloud-run-python"
    VERSION: str | None = None
    PROJECT: str | None = None

    HOST: str = "0.0.0.0"
    PORT: int = 3000

    WORKERS: int = 1

    @computed_field  # type: ignore[prop-decorator]
    @property
    def RELOAD(self) -> bool:
        return self.PYTHON_ENV == "development"

    API_V1_PREFIX: str = "/v1"
    CORS_ORIGINS: list[str] = ["*"]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.CORS_ORIGINS]


settings = Settings()
