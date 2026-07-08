"""Behaviour Timeline and Relationship Graph endpoints (M3)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from idbi.domain.insights import GraphResponse, TimelineResponse
from idbi.services.insight_service import InsightService, get_insight_service

router = APIRouter(tags=["insights"])

InsightDep = Annotated[InsightService, Depends(get_insight_service)]


@router.get("/applicants/{customer_id}/timeline", response_model=TimelineResponse)
def get_timeline(customer_id: str, service: InsightDep) -> TimelineResponse:
    result = service.timeline(customer_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return result


@router.get("/applicants/{customer_id}/graph", response_model=GraphResponse)
def get_graph(customer_id: str, service: InsightDep) -> GraphResponse:
    result = service.graph(customer_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return result
