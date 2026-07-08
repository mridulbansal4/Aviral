"""Typed application settings.

The single source of truth for runtime configuration. Values come from
``config/app.yaml`` and can be overridden by ``IDBI_``-prefixed environment
variables (nested keys use ``__`` as the delimiter, e.g. ``IDBI_LOGGING__LEVEL``).
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from idbi.config.loader import load_yaml


class AppInfo(BaseModel):
    name: str = "IDBI Adaptive Lending Intelligence"
    environment: str = "development"
    api_prefix: str = "/api/v1"


class CorsConfig(BaseModel):
    allow_origins: list[str] = Field(default_factory=list)


class LoggingConfig(BaseModel):
    level: str = "INFO"
    renderer: str = "console"  # "console" | "json"


class DataConfig(BaseModel):
    seed: int = 20260708


class Settings(BaseSettings):
    """Root settings object, assembled from YAML with env-var overrides."""

    model_config = SettingsConfigDict(
        env_prefix="IDBI_",
        env_nested_delimiter="__",
        extra="ignore",
    )

    app: AppInfo = Field(default_factory=AppInfo)
    cors: CorsConfig = Field(default_factory=CorsConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    data: DataConfig = Field(default_factory=DataConfig)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Build settings once: YAML values as the base, env vars override."""
    base = load_yaml("app.yaml")
    return Settings(**base)
