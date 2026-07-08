"""Aggregate router for API v1.

Each feature area registers its own ``APIRouter`` and is mounted here. This
keeps :mod:`idbi.main` thin and makes the versioned surface easy to reason about.
"""

from __future__ import annotations

from fastapi import APIRouter

from idbi.api.v1 import applicants, decisions, health, insights

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(applicants.router)
api_router.include_router(decisions.router)
api_router.include_router(insights.router)

__all__ = ["api_router"]
