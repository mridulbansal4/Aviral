"""Consent service.

Generates a deterministic Account Aggregator consent artifact per customer.
A minority are expired/revoked so the gating is demonstrable: an unusable
consent blocks an offer regardless of how strong the applicant looks.
"""

from __future__ import annotations

from datetime import date
from functools import lru_cache

import numpy as np

from idbi.domain.compliance import Consent, ConsentStatus
from idbi.observability import get_logger
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)

log = get_logger("idbi.consent")

# Reference "today" for consent validity (matches the prototype's clock).
_TODAY = date(2026, 7, 8)
_DATA_SCOPE = ["DEPOSIT", "RECURRING_DEPOSIT", "TERM_DEPOSIT", "SIP"]
_PURPOSE = "Retail lending eligibility assessment (AA consent)"


class ConsentService:
    def __init__(self, population: PopulationService, seed: int):
        # Independent stream so consent draws don't perturb other seeded logic.
        self.rng = np.random.default_rng(seed ^ 0x5DEECE66D)
        self._by_customer: dict[str, Consent] = {}
        self._generate(population)

    def _generate(self, population: PopulationService) -> None:
        for i, record in enumerate(population.repository.all()):
            cid = record.customer.id
            roll = self.rng.random()
            if roll < 0.88:
                status = ConsentStatus.ACTIVE
                granted, expires = date(2026, 1, 1), date(2026, 12, 31)
            elif roll < 0.97:
                status = ConsentStatus.EXPIRED
                granted, expires = date(2025, 5, 1), date(2026, 4, 30)
            else:
                status = ConsentStatus.REVOKED
                granted, expires = date(2026, 1, 1), date(2026, 12, 31)

            self._by_customer[cid] = Consent(
                consent_handle=f"AA-{cid}-{self.rng.integers(1e8, 1e9):09d}",
                customer_id=cid,
                purpose=_PURPOSE,
                data_scope=_DATA_SCOPE,
                fetch_type="periodic",
                granted_on=granted,
                expires_on=expires,
                status=status,
            )

        counts = self.status_counts()
        log.info("consent.generated", **counts)

    def get(self, customer_id: str) -> Consent | None:
        return self._by_customer.get(customer_id)

    def status_counts(self) -> dict[str, int]:
        out = {s.value: 0 for s in ConsentStatus}
        for c in self._by_customer.values():
            out[c.status.value] += 1
        return out


@lru_cache(maxsize=1)
def get_consent_service() -> ConsentService:
    from idbi.config import get_settings

    return ConsentService(
        population=get_population_service(), seed=get_settings().data.seed
    )
