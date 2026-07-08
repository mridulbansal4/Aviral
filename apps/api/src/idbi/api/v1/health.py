"""Health and platform-status endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from idbi import __version__
from idbi.config import feature_flags, get_settings

router = APIRouter(tags=["system"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


class CapabilitiesResponse(BaseModel):
    """Which milestone capabilities are currently enabled."""

    version: str
    flags: dict[str, bool]


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app.name,
        version=__version__,
        environment=settings.app.environment,
    )


@router.get("/capabilities", response_model=CapabilitiesResponse)
def capabilities() -> CapabilitiesResponse:
    """Expose feature flags so the frontend can progressively reveal screens."""
    return CapabilitiesResponse(version=__version__, flags=feature_flags())
