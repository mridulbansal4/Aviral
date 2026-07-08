"""DTOs for Validation and Continuous Learning (M6)."""

from __future__ import annotations

from pydantic import BaseModel

from idbi.ml.metrics import ModelMetrics


class RulePrecision(BaseModel):
    id: str
    label: str
    polarity: str
    coverage: float      # share of applicants for whom the rule is favourable
    precision: float     # conversion rate among those applicants
    lift: float          # precision ÷ base rate


class FamilyContribution(BaseModel):
    family: str          # base | temporal | graph
    feature_count: int
    importance_share: float


class DriftFeature(BaseModel):
    feature: str
    psi: float
    status: str          # stable | minor | material


class DriftReport(BaseModel):
    status: str          # overall
    reference_label: str
    current_label: str
    features: list[DriftFeature]


class ValidationReport(BaseModel):
    model_version: str
    model_metrics: ModelMetrics
    rules: list[RulePrecision]
    family_contribution: list[FamilyContribution]
    drift: DriftReport


class LearningStep(BaseModel):
    step: int
    label: str
    train_size: int
    roc_auc: float
    ks_statistic: float
    lift_top_decile: float


class LearningState(BaseModel):
    simulated: bool = True   # outcomes are simulated — never a real-data claim
    held_out_size: int
    total_pool: int
    steps_total: int
    current_step: int
    can_retrain: bool
    history: list[LearningStep]
