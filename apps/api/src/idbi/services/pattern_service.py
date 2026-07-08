"""Pattern service.

Fits pattern discovery once over the population and serves the discovered
patterns and per-applicant matches.
"""

from __future__ import annotations

from functools import lru_cache

import numpy as np

from idbi.config.loader import load_yaml
from idbi.domain.confidence import DefiningFeatureDTO, PatternDTO, PatternMatch
from idbi.ml.patterns import Pattern, PatternDiscovery
from idbi.observability import get_logger
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)

log = get_logger("idbi.patterns")


class PatternService:
    def __init__(self, population: PopulationService, seed: int):
        self.population = population
        cfg = load_yaml("confidence.yaml")["patterns"]
        self.feature_subset: list[str] = cfg["behaviour_features"]
        self.discovery = PatternDiscovery(
            feature_subset=self.feature_subset,
            k=int(cfg["clusters"]),
            seed=seed,
            margin=float(cfg["significance_margin"]),
        )
        self._index: dict[str, int] = {}
        self._subset: np.ndarray = np.empty((0, 0))
        self._fit()

    def _fit(self) -> None:
        records = {r.customer.id: r for r in self.population.repository.all()}
        rows, y, loan_types, ids = [], [], [], []
        for fv in self.population.all_features():
            rec = records.get(fv.customer_id)
            if rec is None:
                continue
            rows.append([fv.features[name] for name in self.feature_subset])
            y.append(int(rec.outcome.converted))
            loan_types.append(rec.outcome.loan_type)
            ids.append(fv.customer_id)

        self._subset = np.array(rows, dtype=float)
        self._index = {cid: i for i, cid in enumerate(ids)}
        self.discovery.fit(self._subset, np.array(y), loan_types, ids)
        sig = sum(1 for p in self.discovery.patterns if p.significant)
        log.info(
            "patterns.discovered",
            clusters=len(self.discovery.patterns),
            significant=sig,
        )

    # -- serving ---------------------------------------------------------------
    def patterns(self) -> list[PatternDTO]:
        return [self._to_dto(p) for p in self.discovery.patterns]

    def match(self, customer_id: str) -> PatternMatch | None:
        idx = self._index.get(customer_id)
        if idx is None:
            return None
        cluster_id, membership = self.discovery.assign(self._subset[idx])
        pattern = self.discovery.pattern_for(cluster_id)
        if pattern is None:
            return None
        return PatternMatch(
            pattern_id=pattern.id,
            label=pattern.label,
            membership=round(membership, 4),
            precision=round(pattern.precision, 4),
            lift=round(pattern.lift, 3),
        )

    @staticmethod
    def _to_dto(p: Pattern) -> PatternDTO:
        return PatternDTO(
            id=p.id,
            label=p.label,
            support=p.support,
            precision=round(p.precision, 4),
            lift=round(p.lift, 3),
            dominant_loan_type=p.dominant_loan_type,
            significant=p.significant,
            defining_features=[
                DefiningFeatureDTO(feature=d.feature, z=round(d.z, 3), phrase=d.phrase)
                for d in p.defining_features
            ],
            example_customer_ids=p.example_customer_ids,
        )


@lru_cache(maxsize=1)
def get_pattern_service() -> PatternService:
    from idbi.config import get_settings

    return PatternService(
        population=get_population_service(), seed=get_settings().data.seed
    )
