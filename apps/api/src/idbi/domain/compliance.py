"""Compliance, consent and model-card DTOs (M5)."""

from __future__ import annotations

from datetime import date
from enum import StrEnum

from pydantic import BaseModel


class ConsentStatus(StrEnum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class Consent(BaseModel):
    """An Account Aggregator consent artifact — a first-class object that gates
    whether the platform may use a customer's financial data."""

    consent_handle: str
    customer_id: str
    purpose: str
    data_scope: list[str]        # FI types the consent covers
    fetch_type: str              # "periodic" | "onetime"
    granted_on: date
    expires_on: date
    status: ConsentStatus

    @property
    def is_usable(self) -> bool:
        return self.status is ConsentStatus.ACTIVE


class ModelCard(BaseModel):
    """A generated model card — provenance and governance for the propensity
    model, in the spirit of Model Cards for Model Reporting."""

    model_version: str
    purpose: str
    training_population: int
    used_features: list[str]
    prohibited_features: list[str]
    review_required_features: list[str]
    metrics: dict[str, float]
    fairness_statement: str
    limitations: list[str]


class ComplianceSummary(BaseModel):
    """Portfolio-level governance posture for the Governance screen."""

    model_version: str
    total_applicants: int
    consent_active: int
    consent_expired: int
    consent_revoked: int
    prohibited_feature_count: int
    used_feature_count: int
