"""Decision DTOs — the explainable output an RM sees for one applicant."""

from __future__ import annotations

from pydantic import BaseModel

from idbi.domain.enums import LoanType
from idbi.rules.engine import Band, RuleResult


class ShapEvidence(BaseModel):
    feature: str
    value: float
    contribution: float          # signed log-odds contribution
    direction: str               # "increases" | "decreases"
    provenance: str              # where the feature came from (for the UI)


class GroundTruth(BaseModel):
    """Synthetic-only: the true outcome, shown so reviewers can judge honesty.

    Would not exist in production — included because this is a seeded prototype
    and letting reviewers see model-vs-truth builds trust in the metrics.
    """

    converted: bool
    loan_type: LoanType
    latent_probability: float


class Decision(BaseModel):
    customer_id: str
    name: str
    verified_monthly_income: float

    propensity: float                 # model probability of conversion (0–1)
    band: Band
    model_confidence: float           # provisional; full algebra arrives in M4
    recommended_product: str

    rule_score: float
    rules: list[RuleResult]

    base_value: float                 # SHAP base (population log-odds)
    evidence: list[ShapEvidence]      # per-feature SHAP, ranked by |impact|

    model_version: str
    ground_truth: GroundTruth
