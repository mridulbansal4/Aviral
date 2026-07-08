"""Decision service — the hybrid engine.

Fuses the deterministic rules engine (bank-required, fully auditable) with the
ML propensity model (native SHAP) into one explainable :class:`Decision`. This
is the object the Applicant 360 screen renders.
"""

from __future__ import annotations

from functools import lru_cache

from idbi.domain.decision import Decision, GroundTruth, ShapEvidence
from idbi.rules.engine import RulesEngine, get_rules_engine
from idbi.services.model_service import ModelService, get_model_service
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)


class DecisionService:
    def __init__(
        self,
        population: PopulationService,
        model: ModelService,
        rules: RulesEngine,
    ):
        self.population = population
        self.model = model
        self.rules = rules

    def decide(self, customer_id: str) -> Decision | None:
        record = self.population.record(customer_id)
        fv = self.population.features(customer_id)
        propensity = self.model.propensity(customer_id)
        explained = self.model.explain(customer_id)
        if record is None or fv is None or propensity is None or explained is None:
            return None

        contributions, base_value = explained
        evidence = [
            ShapEvidence(
                feature=c.feature,
                value=c.value,
                contribution=c.contribution,
                direction=c.direction,
                provenance=fv.provenance.get(c.feature, ""),
            )
            for c in contributions
        ]

        rule_results = self.rules.evaluate(fv.features)
        rule_score = self.rules.rule_score(rule_results)

        return Decision(
            customer_id=customer_id,
            name=record.customer.name,
            verified_monthly_income=fv.features["verified_monthly_income"],
            propensity=propensity,
            band=self.rules.band(propensity),
            model_confidence=abs(propensity - 0.5) * 2.0,
            recommended_product=self.rules.route_product(fv.features),
            rule_score=rule_score,
            rules=rule_results,
            base_value=base_value,
            evidence=evidence,
            model_version=self.model.version,
            ground_truth=GroundTruth(
                converted=record.outcome.converted,
                loan_type=record.outcome.loan_type,
                latent_probability=record.outcome.latent_probability,
            ),
        )


@lru_cache(maxsize=1)
def get_decision_service() -> DecisionService:
    return DecisionService(
        population=get_population_service(),
        model=get_model_service(),
        rules=get_rules_engine(),
    )
