"""Confidence service — the defined five-dimensional confidence algebra.

Each sub-confidence is an explicit, documented function of observable inputs;
Decision Confidence is their config-weighted sum. There are no tuned magic
constants in code — weights and normalization references come from
``config/confidence.yaml``. Every dimension returns its inputs and a rationale
so the Confidence Inspector can show *why*, not just *how much*.
"""

from __future__ import annotations

import math
from functools import lru_cache

from pydantic import BaseModel

from idbi.config.loader import load_yaml
from idbi.domain.confidence import ConfidenceDimension, ConfidenceReport
from idbi.domain.models import CustomerRecord, FeatureVector
from idbi.rules.engine import Band
from idbi.services.model_service import ModelService, get_model_service
from idbi.services.pattern_service import PatternService, get_pattern_service
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)


class _Norm(BaseModel):
    history_months: int
    expected_counterparties: int
    min_transactions: int
    stability_reference: float


class _ConfidenceConfig(BaseModel):
    weights: dict[str, float]
    normalization: _Norm
    bands: list[dict]

    @classmethod
    def load(cls) -> "_ConfidenceConfig":
        raw = load_yaml("confidence.yaml")
        return cls(
            weights=raw["weights"],
            normalization=raw["normalization"],
            bands=raw["bands"],
        )


def _binary_entropy_bits(p: float) -> float:
    if p <= 0.0 or p >= 1.0:
        return 0.0
    return -(p * math.log2(p) + (1 - p) * math.log2(1 - p))


def _clamp(x: float) -> float:
    return max(0.0, min(1.0, x))


class ConfidenceService:
    def __init__(
        self,
        population: PopulationService,
        model: ModelService,
        patterns: PatternService,
    ):
        self.population = population
        self.model = model
        self.patterns = patterns
        self.cfg = _ConfidenceConfig.load()

    # -- individual dimensions -------------------------------------------------
    def _data(self, record: CustomerRecord, fv: FeatureVector) -> ConfidenceDimension:
        n = self.cfg.normalization
        months = len({(t.date.year, t.date.month) for t in record.transactions})
        months_ratio = _clamp(months / n.history_months)
        has_salary = 1.0 if fv.features.get("verified_monthly_income", 0) > 0 else 0.0
        txn_adequacy = _clamp(len(record.transactions) / n.min_transactions)
        value = (months_ratio + has_salary + txn_adequacy) / 3
        return ConfidenceDimension(
            key="data", label="Data Confidence", value=round(value, 4),
            weight=self.cfg.weights["data"],
            rationale=f"{months}/{n.history_months} months of history, "
                      f"{len(record.transactions)} transactions, salary verified.",
            inputs={"months_ratio": round(months_ratio, 3),
                    "has_salary": has_salary,
                    "txn_adequacy": round(txn_adequacy, 3)},
        )

    def _model(self, propensity: float) -> ConfidenceDimension:
        entropy = _binary_entropy_bits(propensity)
        value = _clamp(1.0 - entropy)
        return ConfidenceDimension(
            key="model", label="Model Confidence", value=round(value, 4),
            weight=self.cfg.weights["model"],
            rationale=f"Prediction {propensity:.0%} sits "
                      f"{'far from' if value > 0.5 else 'near'} the decision "
                      f"boundary (entropy {entropy:.2f} bits).",
            inputs={"propensity": round(propensity, 3),
                    "entropy_bits": round(entropy, 3)},
        )

    def _graph(self, fv: FeatureVector) -> ConfidenceDimension:
        n = self.cfg.normalization
        coverage = _clamp(
            fv.features.get("graph_counterparty_count", 0) / n.expected_counterparties
        )
        salary_source = _clamp(fv.features.get("graph_salary_sources", 0) / 1.0)
        value = (coverage + salary_source) / 2
        return ConfidenceDimension(
            key="graph", label="Graph Confidence", value=round(value, 4),
            weight=self.cfg.weights["graph"],
            rationale="Knowledge-graph coverage of counterparties and a verified "
                      "salary source.",
            inputs={"counterparty_coverage": round(coverage, 3),
                    "salary_source": round(salary_source, 3)},
        )

    def _temporal(self, record: CustomerRecord, fv: FeatureVector) -> ConfidenceDimension:
        n = self.cfg.normalization
        months = len({(t.date.year, t.date.month) for t in record.transactions})
        months_ratio = _clamp(months / n.history_months)
        stability = _clamp(
            fv.features.get("income_stability", 0) / n.stability_reference
        )
        value = (months_ratio + stability) / 2
        return ConfidenceDimension(
            key="temporal", label="Temporal Confidence", value=round(value, 4),
            weight=self.cfg.weights["temporal"],
            rationale="Length of behavioural history and steadiness of income.",
            inputs={"months_ratio": round(months_ratio, 3),
                    "stability_norm": round(stability, 3)},
        )

    def _pattern(self, customer_id: str) -> ConfidenceDimension:
        base_rate = self.model.metrics.base_rate
        match = self.patterns.match(customer_id)
        if match is None:
            value, membership, decisiveness, precision = 0.0, 0.0, 0.0, base_rate
        else:
            membership = match.membership
            precision = match.precision
            decisiveness = _clamp(2 * abs(precision - base_rate))
            value = membership * decisiveness
        return ConfidenceDimension(
            key="pattern", label="Pattern Confidence", value=round(value, 4),
            weight=self.cfg.weights["pattern"],
            rationale="How clearly the applicant falls into a decisive behavioural "
                      "pattern (membership × how far its rate departs from base).",
            inputs={"membership": round(membership, 3),
                    "pattern_precision": round(precision, 3),
                    "decisiveness": round(decisiveness, 3),
                    "base_rate": round(base_rate, 3)},
        )

    def _band(self, score: float) -> Band:
        for b in self.cfg.bands:
            if score >= float(b["min"]):
                return Band(label=b["label"], tone=b["tone"])
        return Band(label="Tentative", tone="muted")

    # -- aggregate -------------------------------------------------------------
    def report(self, customer_id: str) -> ConfidenceReport | None:
        record = self.population.record(customer_id)
        fv = self.population.features(customer_id)
        propensity = self.model.propensity(customer_id)
        if record is None or fv is None or propensity is None:
            return None

        dims = [
            self._data(record, fv),
            self._model(propensity),
            self._graph(fv),
            self._pattern(customer_id),
            self._temporal(record, fv),
        ]
        decision = sum(d.value * d.weight for d in dims)
        return ConfidenceReport(
            customer_id=customer_id,
            dimensions=dims,
            decision_confidence=round(decision, 4),
            band=self._band(decision),
        )


@lru_cache(maxsize=1)
def get_confidence_service() -> ConfidenceService:
    return ConfidenceService(
        population=get_population_service(),
        model=get_model_service(),
        patterns=get_pattern_service(),
    )
