"""DTOs for Confidence Intelligence and Pattern Discovery (M4)."""

from __future__ import annotations

from pydantic import BaseModel

from idbi.domain.enums import LoanType
from idbi.rules.engine import Band


class ConfidenceDimension(BaseModel):
    key: str
    label: str
    value: float                 # 0–1
    weight: float                # its share of decision confidence
    rationale: str
    inputs: dict[str, float]     # the raw quantities behind the score


class ConfidenceReport(BaseModel):
    customer_id: str
    dimensions: list[ConfidenceDimension]
    decision_confidence: float
    band: Band


class DefiningFeatureDTO(BaseModel):
    feature: str
    z: float
    phrase: str


class PatternDTO(BaseModel):
    id: int
    label: str
    support: int
    precision: float
    lift: float
    dominant_loan_type: LoanType
    significant: bool
    defining_features: list[DefiningFeatureDTO]
    example_customer_ids: list[str]


class PatternMatch(BaseModel):
    pattern_id: int
    label: str
    membership: float
    precision: float
    lift: float
