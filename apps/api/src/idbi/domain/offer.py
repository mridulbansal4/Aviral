"""Offer orchestration DTOs (M5)."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel

from idbi.domain.compliance import ConsentStatus


class OfferStatus(StrEnum):
    APPROVED_IN_PRINCIPLE = "approved_in_principle"
    REFERRED = "referred"
    DECLINED = "declined"


class EligibilityCheck(BaseModel):
    id: str
    label: str
    passed: bool
    detail: str


class PricingLine(BaseModel):
    label: str
    value: str


class Offer(BaseModel):
    customer_id: str
    product: str
    product_label: str
    status: OfferStatus

    principal: float
    tenure_months: int
    annual_rate: float
    monthly_emi: float

    foir_before: float
    foir_after: float

    risk_band: str
    decision_confidence: float

    # Which cap bound the principal — transparency on how the number was set.
    max_principal_by_income: float
    max_principal_by_foir: float

    consent_status: ConsentStatus
    pricing: list[PricingLine]
    checks: list[EligibilityCheck]
