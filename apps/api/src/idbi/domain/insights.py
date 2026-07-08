"""DTOs for the Behaviour Timeline and Relationship Graph screens (M3)."""

from __future__ import annotations

from pydantic import BaseModel


class TimelinePoint(BaseModel):
    month: str                    # "YYYY-MM"
    income: float
    total_spend: float
    net_savings: float
    categories: dict[str, float]  # per-category debit magnitude


class InsightMetric(BaseModel):
    key: str
    label: str
    value: float
    provenance: str
    tone: str                     # "positive" | "warning" | "muted"


class TimelineResponse(BaseModel):
    customer_id: str
    points: list[TimelinePoint]
    metrics: list[InsightMetric]


class GraphNodeDTO(BaseModel):
    id: str
    label: str
    kind: str
    subtype: str
    is_focus: bool = False


class GraphEdgeDTO(BaseModel):
    source: str
    target: str
    edge_type: str
    total: float
    count: int


class GraphResponse(BaseModel):
    customer_id: str
    nodes: list[GraphNodeDTO]
    edges: list[GraphEdgeDTO]
    features: list[InsightMetric]
