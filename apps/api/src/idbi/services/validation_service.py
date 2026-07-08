"""Validation service.

Assembles the validation report: honest model metrics, per-rule precision/lift,
feature-family contribution (base vs temporal vs graph), and PSI drift between
two population cohorts.
"""

from __future__ import annotations

from functools import lru_cache

import numpy as np

from idbi.domain.validation import (
    DriftFeature,
    DriftReport,
    FamilyContribution,
    RulePrecision,
    ValidationReport,
)
from idbi.features.definitions import FEATURE_DEFS
from idbi.features.temporal import TEMPORAL_FEATURE_DEFS
from idbi.graph.features import GRAPH_FEATURE_NAMES
from idbi.ml.validation import drift_status, population_stability_index
from idbi.rules.engine import RulesEngine, get_rules_engine
from idbi.services.model_service import ModelService, get_model_service
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)

_BASE_NAMES = {d.name for d in FEATURE_DEFS}
_TEMPORAL_NAMES = {d.name for d in TEMPORAL_FEATURE_DEFS}
_GRAPH_NAMES = set(GRAPH_FEATURE_NAMES)

_WORST = {"stable": 0, "minor": 1, "material": 2}


class ValidationService:
    def __init__(
        self,
        population: PopulationService,
        model: ModelService,
        rules: RulesEngine,
    ):
        self.population = population
        self.model = model
        self.rules = rules

    def _family_of(self, name: str) -> str:
        if name in _TEMPORAL_NAMES:
            return "temporal"
        if name in _GRAPH_NAMES:
            return "graph"
        return "base"

    def _rule_precision(self) -> list[RulePrecision]:
        records = self.population.repository.all()
        base = self.model.metrics.base_rate
        rows: list[RulePrecision] = []
        # Evaluate each rule across the whole population.
        agg: dict[str, dict] = {}
        for rec in records:
            fv = self.population.features(rec.customer.id)
            if fv is None:
                continue
            for r in self.rules.evaluate(fv.features):
                a = agg.setdefault(
                    r.id,
                    {"label": r.label, "polarity": r.polarity,
                     "fav": 0, "fav_conv": 0},
                )
                favourable = r.passed if r.polarity == "positive" else not r.passed
                if favourable:
                    a["fav"] += 1
                    a["fav_conv"] += int(rec.outcome.converted)
        n = len(records)
        for rid, a in agg.items():
            coverage = a["fav"] / n if n else 0.0
            precision = a["fav_conv"] / a["fav"] if a["fav"] else 0.0
            rows.append(RulePrecision(
                id=rid, label=a["label"], polarity=a["polarity"],
                coverage=round(coverage, 4), precision=round(precision, 4),
                lift=round(precision / base, 3) if base else 0.0,
            ))
        rows.sort(key=lambda x: x.lift, reverse=True)
        return rows

    def _family_contribution(self) -> list[FamilyContribution]:
        importance = self.model.gain_importance()
        families: dict[str, dict] = {}
        for name, share in importance.items():
            fam = self._family_of(name)
            f = families.setdefault(fam, {"share": 0.0, "count": 0})
            f["share"] += share
            f["count"] += 1
        order = {"base": 0, "temporal": 1, "graph": 2}
        return [
            FamilyContribution(
                family=fam, feature_count=f["count"],
                importance_share=round(f["share"], 4),
            )
            for fam, f in sorted(families.items(), key=lambda kv: order.get(kv[0], 9))
        ]

    def _drift(self) -> DriftReport:
        """PSI between two deterministic cohorts (even vs odd index) as a proxy
        for reference-vs-recent. A stable synthetic population should show low
        PSI — we report that honestly rather than manufacturing drift."""
        fvs = self.population.all_features()
        names = self.model.feature_names
        ref_rows, cur_rows = [], []
        for i, fv in enumerate(fvs):
            row = [fv.features[n] for n in names]
            (ref_rows if i % 2 == 0 else cur_rows).append(row)
        ref = np.array(ref_rows)
        cur = np.array(cur_rows)

        features: list[DriftFeature] = []
        worst = "stable"
        for j, name in enumerate(names):
            psi = population_stability_index(ref[:, j], cur[:, j])
            status = drift_status(psi)
            if _WORST[status] > _WORST[worst]:
                worst = status
            features.append(DriftFeature(
                feature=name, psi=round(psi, 4), status=status
            ))
        features.sort(key=lambda d: d.psi, reverse=True)
        return DriftReport(
            status=worst,
            reference_label="Reference cohort",
            current_label="Recent cohort",
            features=features,
        )

    def report(self) -> ValidationReport:
        return ValidationReport(
            model_version=self.model.version,
            model_metrics=self.model.metrics,
            rules=self._rule_precision(),
            family_contribution=self._family_contribution(),
            drift=self._drift(),
        )


@lru_cache(maxsize=1)
def get_validation_service() -> ValidationService:
    return ValidationService(
        population=get_population_service(),
        model=get_model_service(),
        rules=get_rules_engine(),
    )
