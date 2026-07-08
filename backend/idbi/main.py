"""FastAPI application factory.

Assembles configuration, logging, middleware and the versioned router into an
ASGI app. Kept deliberately thin — feature logic lives in services and routers.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from idbi import __version__
from idbi.api.v1 import api_router
from idbi.config import get_settings
from idbi.observability import configure_logging, get_logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(settings.logging)
    log = get_logger("idbi.startup")
    log.info(
        "api.startup",
        service=settings.app.name,
        version=__version__,
        environment=settings.app.environment,
    )
    yield
    get_logger("idbi.shutdown").info("api.shutdown")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app.name,
        version=__version__,
        description="Explainable, adaptive retail-lending intelligence for IDBI.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors.allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.app.api_prefix)
    return app


app = create_app()
