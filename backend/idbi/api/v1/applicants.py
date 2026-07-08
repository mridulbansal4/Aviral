"""Applicant and feature endpoints (M1)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from idbi.domain.models import (
    ApplicantSummary,
    CustomerRecord,
    FeatureVector,
)
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)

router = APIRouter(tags=["applicants"])

ServiceDep = Annotated[PopulationService, Depends(get_population_service)]


@router.get("/applicants", response_model=list[ApplicantSummary])
def list_applicants(service: ServiceDep) -> list[ApplicantSummary]:
    return service.summaries()


@router.get("/applicants/{customer_id}", response_model=CustomerRecord)
def get_applicant(customer_id: str, service: ServiceDep) -> CustomerRecord:
    record = service.record(customer_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return record


@router.get("/applicants/{customer_id}/features", response_model=FeatureVector)
def get_applicant_features(customer_id: str, service: ServiceDep) -> FeatureVector:
    fv = service.features(customer_id)
    if fv is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return fv


@router.get("/compliance/feature-manifest")
def feature_manifest(service: ServiceDep) -> dict[str, list[str]]:
    """What the feature store uses, refuses, and flags for fairness review."""
    return service.compliance_manifest()
