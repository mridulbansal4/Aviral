"""Compliance service — generates the model card and the governance summary.

Surfaces the guardrails that already exist (the prohibited-feature registry,
enforced by the feature store) as an auditable governance artifact, and rolls
up consent posture across the portfolio.
"""

from __future__ import annotations

from functools import lru_cache

from idbi.domain.compliance import ComplianceSummary, ModelCard
from idbi.services.consent_service import ConsentService, get_consent_service
from idbi.services.model_service import ModelService, get_model_service
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)

_FAIRNESS = (
    "Protected attributes (gender, religion, caste, marital status) and known "
    "proxies (name, area pincode, constituency) are refused in code at the "
    "feature-store boundary and can never enter the model. Age and city tier are "
    "permitted but flagged for periodic bias review."
)

_LIMITATIONS = [
    "Trained on synthetic data generated from a known causal process; metrics "
    "are reproducible but not a claim about real-world performance.",
    "Continuous-learning outcomes are simulated and clearly labelled as such.",
    "Graph and temporal features add signal only where the data supports it; "
    "their contribution is reported, not assumed.",
]


class ComplianceService:
    def __init__(
        self,
        population: PopulationService,
        model: ModelService,
        consent: ConsentService,
    ):
        self.population = population
        self.model = model
        self.consent = consent

    def model_card(self) -> ModelCard:
        manifest = self.population.compliance_manifest()
        m = self.model.metrics
        return ModelCard(
            model_version=self.model.version,
            purpose="Estimate retail-loan propensity to prioritize RM outreach; "
                    "decisions remain human-in-the-loop.",
            training_population=m.n_samples,
            used_features=manifest["used_features"],
            prohibited_features=manifest["prohibited"],
            review_required_features=manifest["review_required"],
            metrics={
                "roc_auc": round(m.roc_auc, 4),
                "ks_statistic": round(m.ks_statistic, 4),
                "lift_top_decile": round(m.lift_top_decile, 3),
                "base_rate": round(m.base_rate, 4),
            },
            fairness_statement=_FAIRNESS,
            limitations=_LIMITATIONS,
        )

    def summary(self) -> ComplianceSummary:
        manifest = self.population.compliance_manifest()
        counts = self.consent.status_counts()
        return ComplianceSummary(
            model_version=self.model.version,
            total_applicants=self.population.repository.count(),
            consent_active=counts["active"],
            consent_expired=counts["expired"],
            consent_revoked=counts["revoked"],
            prohibited_feature_count=len(manifest["prohibited"]),
            used_feature_count=len(manifest["used_features"]),
        )


@lru_cache(maxsize=1)
def get_compliance_service() -> ComplianceService:
    return ComplianceService(
        population=get_population_service(),
        model=get_model_service(),
        consent=get_consent_service(),
    )
