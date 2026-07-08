"""Confidence Intelligence and Pattern Discovery endpoints (M4)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from idbi.domain.confidence import ConfidenceReport, PatternDTO, PatternMatch
from idbi.services.confidence_service import (
    ConfidenceService,
    get_confidence_service,
)
from idbi.services.pattern_service import PatternService, get_pattern_service

router = APIRouter(tags=["intelligence"])

ConfidenceDep = Annotated[ConfidenceService, Depends(get_confidence_service)]
PatternDep = Annotated[PatternService, Depends(get_pattern_service)]


@router.get("/applicants/{customer_id}/confidence", response_model=ConfidenceReport)
def get_confidence(customer_id: str, service: ConfidenceDep) -> ConfidenceReport:
    report = service.report(customer_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return report


@router.get("/patterns", response_model=list[PatternDTO])
def list_patterns(service: PatternDep) -> list[PatternDTO]:
    return service.patterns()


@router.get("/applicants/{customer_id}/pattern", response_model=PatternMatch)
def get_pattern_match(customer_id: str, service: PatternDep) -> PatternMatch:
    match = service.match(customer_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return match
