"""Insight service — assembles the Behaviour Timeline and Relationship Graph.

Read-only projections over the population + knowledge graph for the two M3
screens. No new modelling here; it reshapes existing features and graph
structure for visualization.
"""

from __future__ import annotations

from functools import lru_cache

from idbi.domain.enums import TransactionCategory
from idbi.domain.insights import (
    GraphEdgeDTO,
    GraphNodeDTO,
    GraphResponse,
    InsightMetric,
    TimelinePoint,
    TimelineResponse,
)
from idbi.features.series import (
    category_debit_series,
    month_keys,
    net_series,
    salary_series,
    total_debit_series,
)
from idbi.graph.features import GRAPH_FEATURE_NAMES, GRAPH_FEATURE_PROVENANCE
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)

# Metrics surfaced on the timeline, with friendly labels.
_TEMPORAL_METRICS = {
    "temporal_income_trend": "Income trend",
    "temporal_spending_momentum": "Spending momentum",
    "temporal_savings_acceleration": "Savings acceleration",
    "temporal_volatility_trend": "Volatility trend",
    "temporal_discretionary_seasonality": "Discretionary seasonality",
    "salary_growth_3m": "3-month income growth",
    "savings_momentum": "Savings momentum",
    "income_stability": "Income stability",
}

_TIMELINE_CATEGORIES = [
    TransactionCategory.RENT,
    TransactionCategory.EMI,
    TransactionCategory.GROCERIES,
    TransactionCategory.DISCRETIONARY,
    TransactionCategory.INVESTMENT,
    TransactionCategory.MEDICAL,
    TransactionCategory.BUILDER_PAYMENT,
]


def _tone(key: str, value: float) -> str:
    """Colour hint: higher is better for most, worse for spending/volatility."""
    negative_when_high = {"temporal_spending_momentum", "temporal_volatility_trend"}
    if abs(value) < 1e-6:
        return "muted"
    if key in negative_when_high:
        return "warning" if value > 0 else "positive"
    return "positive" if value > 0 else "warning"


class InsightService:
    def __init__(self, population: PopulationService):
        self.population = population

    def timeline(self, customer_id: str) -> TimelineResponse | None:
        record = self.population.record(customer_id)
        fv = self.population.features(customer_id)
        if record is None or fv is None:
            return None

        keys = month_keys(record)
        income = salary_series(record)
        spend = total_debit_series(record)
        net = net_series(record)
        cat_series = {
            c.value: category_debit_series(record, c) for c in _TIMELINE_CATEGORIES
        }

        points = [
            TimelinePoint(
                month=keys[i],
                income=round(float(income[i]), 2),
                total_spend=round(float(spend[i]), 2),
                net_savings=round(float(net[i]), 2),
                categories={
                    name: round(float(series[i]), 2)
                    for name, series in cat_series.items()
                    if series[i] > 0
                },
            )
            for i in range(len(keys))
        ]

        metrics = [
            InsightMetric(
                key=key,
                label=label,
                value=round(fv.features.get(key, 0.0), 4),
                provenance=fv.provenance.get(key, ""),
                tone=_tone(key, fv.features.get(key, 0.0)),
            )
            for key, label in _TEMPORAL_METRICS.items()
            if key in fv.features
        ]
        return TimelineResponse(customer_id=customer_id, points=points, metrics=metrics)

    def graph(self, customer_id: str) -> GraphResponse | None:
        kg = self.population.graph
        record = self.population.record(customer_id)
        fv = self.population.features(customer_id)
        if kg is None or record is None or fv is None:
            return None

        nodes, edges = kg.ego(customer_id)
        node_dtos = [
            GraphNodeDTO(
                id=n.id, label=n.label, kind=n.kind, subtype=n.subtype,
                is_focus=(n.id == customer_id),
            )
            for n in nodes
        ]
        edge_dtos = [
            GraphEdgeDTO(
                source=e.source, target=e.target, edge_type=e.edge_type,
                total=e.total, count=e.count,
            )
            for e in edges
        ]
        features = [
            InsightMetric(
                key=name,
                label=name.replace("graph_", "").replace("_", " ").title(),
                value=round(fv.features.get(name, 0.0), 4),
                provenance=GRAPH_FEATURE_PROVENANCE.get(name, ""),
                tone="muted",
            )
            for name in GRAPH_FEATURE_NAMES
            if name in fv.features
        ]
        return GraphResponse(
            customer_id=customer_id, nodes=node_dtos, edges=edge_dtos, features=features
        )


@lru_cache(maxsize=1)
def get_insight_service() -> InsightService:
    return InsightService(population=get_population_service())
