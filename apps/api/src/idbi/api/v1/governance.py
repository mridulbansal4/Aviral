"""Compliance, consent and offer endpoints (M5)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from idbi.domain.compliance import ComplianceSummary, Consent, ModelCard
from idbi.domain.offer import Offer
from idbi.services.compliance_service import (
    ComplianceService,
    get_compliance_service,
)
from idbi.services.consent_service import ConsentService, get_consent_service
from idbi.services.offer_service import OfferService, get_offer_service

router = APIRouter(tags=["governance"])

ComplianceDep = Annotated[ComplianceService, Depends(get_compliance_service)]
ConsentDep = Annotated[ConsentService, Depends(get_consent_service)]
OfferDep = Annotated[OfferService, Depends(get_offer_service)]


@router.get("/compliance/model-card", response_model=ModelCard)
def model_card(service: ComplianceDep) -> ModelCard:
    return service.model_card()


@router.get("/compliance/summary", response_model=ComplianceSummary)
def compliance_summary(service: ComplianceDep) -> ComplianceSummary:
    return service.summary()


@router.get("/applicants/{customer_id}/consent", response_model=Consent)
def get_consent(customer_id: str, service: ConsentDep) -> Consent:
    consent = service.get(customer_id)
    if consent is None:
        raise HTTPException(status_code=404, detail="Consent not found")
    return consent


@router.get("/applicants/{customer_id}/offer", response_model=Offer)
def get_offer(customer_id: str, service: OfferDep) -> Offer:
    offer = service.orchestrate(customer_id)
    if offer is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return offer
