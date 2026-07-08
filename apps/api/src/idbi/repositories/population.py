"""In-memory population repository.

Hidden behind a Protocol so the storage engine can later become DuckDB/Postgres
without touching services. For a seeded prototype, an in-memory store keyed by
customer id is the right amount of machinery.
"""

from __future__ import annotations

from typing import Protocol

from idbi.domain.models import CustomerRecord


class PopulationRepository(Protocol):
    def upsert_many(self, records: list[CustomerRecord]) -> None: ...
    def all(self) -> list[CustomerRecord]: ...
    def get(self, customer_id: str) -> CustomerRecord | None: ...
    def count(self) -> int: ...


class InMemoryPopulationRepository:
    def __init__(self) -> None:
        self._by_id: dict[str, CustomerRecord] = {}

    def upsert_many(self, records: list[CustomerRecord]) -> None:
        for r in records:
            self._by_id[r.customer.id] = r

    def all(self) -> list[CustomerRecord]:
        return list(self._by_id.values())

    def get(self, customer_id: str) -> CustomerRecord | None:
        return self._by_id.get(customer_id)

    def count(self) -> int:
        return len(self._by_id)
