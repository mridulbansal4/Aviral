"""Population service.

Orchestrates one seeded generation of the population, builds guarded feature
vectors, and serves read queries. Instantiated once per process (see
:func:`get_population_service`) so the seeded data is generated a single time
and every request sees identical, reproducible data.
"""

from __future__ import annotations

from functools import lru_cache

from idbi.domain.models import ApplicantSummary, CustomerRecord, FeatureVector
from idbi.features.store import FeatureStore
from idbi.observability import get_logger
from idbi.repositories.population import (
    InMemoryPopulationRepository,
    PopulationRepository,
)
from idbi.synthesis import SyntheticPopulation

log = get_logger("idbi.population")


class PopulationService:
    def __init__(
        self,
        seed: int,
        repository: PopulationRepository | None = None,
        feature_store: FeatureStore | None = None,
    ) -> None:
        self.seed = seed
        self.repository = repository or InMemoryPopulationRepository()
        self.feature_store = feature_store or FeatureStore()
        self._features: dict[str, FeatureVector] = {}
        self._generate()

    def _generate(self) -> None:
        records = SyntheticPopulation(seed=self.seed).generate()
        self.repository.upsert_many(records)
        for record in records:
            self._features[record.customer.id] = self.feature_store.build(record)
        converted = sum(1 for r in records if r.outcome.converted)
        log.info(
            "population.generated",
            seed=self.seed,
            customers=len(records),
            converted=converted,
            conversion_rate=round(converted / max(1, len(records)), 3),
        )

    # -- queries ---------------------------------------------------------------
    def summaries(self) -> list[ApplicantSummary]:
        out: list[ApplicantSummary] = []
        for r in self.repository.all():
            fv = self._features[r.customer.id]
            out.append(ApplicantSummary(
                customer_id=r.customer.id,
                name=r.customer.name,
                age=r.customer.age,
                employment_type=r.customer.employment_type,
                city_tier=r.customer.city_tier,
                verified_monthly_income=fv.features["verified_monthly_income"],
                converted=r.outcome.converted,
                loan_type=r.outcome.loan_type,
            ))
        return out

    def record(self, customer_id: str) -> CustomerRecord | None:
        return self.repository.get(customer_id)

    def features(self, customer_id: str) -> FeatureVector | None:
        return self._features.get(customer_id)

    def all_features(self) -> list[FeatureVector]:
        return list(self._features.values())

    def compliance_manifest(self) -> dict[str, list[str]]:
        return self.feature_store.compliance_manifest()


@lru_cache(maxsize=1)
def get_population_service() -> PopulationService:
    from idbi.config import get_settings

    return PopulationService(seed=get_settings().data.seed)
