"""Graph feature family (M3).

Per-customer features derived from the knowledge graph, fed to the same
propensity model. We keep them honest: some (builder exposure) carry real
home-loan signal; others (employer reach) are weak by construction — their true
SHAP contribution is reported rather than inflated.
"""

from __future__ import annotations

from idbi.domain.enums import CounterpartyType
from idbi.graph.knowledge_graph import KnowledgeGraph

# Fixed order — defines the graph block of the model's feature vector.
GRAPH_FEATURE_NAMES = [
    "graph_counterparty_count",
    "graph_salary_sources",
    "graph_builder_exposure",
    "graph_lender_count",
    "graph_employer_reach",
]

GRAPH_FEATURE_PROVENANCE = {
    "graph_counterparty_count": "distinct counterparties in the graph",
    "graph_salary_sources": "number of salary-source employers",
    "graph_builder_exposure": "builder payments ÷ salary inflow",
    "graph_lender_count": "number of lender relationships",
    "graph_employer_reach": "peers sharing the customer's employer(s)",
}


def compute_graph_features(kg: KnowledgeGraph, customer_id: str) -> dict[str, float]:
    g = kg.g
    if customer_id not in g:
        return {name: 0.0 for name in GRAPH_FEATURE_NAMES}

    salary_total = 0.0
    builder_total = 0.0
    salary_sources = 0
    lender_count = 0
    employer_ids: list[str] = []

    for cp in g.neighbors(customer_id):
        data = g.nodes[cp]
        edge = g.edges[customer_id, cp]
        subtype = data["subtype"]
        if subtype == CounterpartyType.EMPLOYER.value:
            salary_sources += 1
            salary_total += edge["total"]
            employer_ids.append(cp)
        elif subtype == CounterpartyType.BUILDER.value:
            builder_total += edge["total"]
        elif subtype == CounterpartyType.LENDER.value:
            lender_count += 1

    # 2-hop reach: peers sharing this customer's employer(s).
    reach = 0
    for emp in employer_ids:
        reach += sum(
            1 for n in g.neighbors(emp)
            if g.nodes[n]["kind"] == "customer" and n != customer_id
        )

    return {
        "graph_counterparty_count": float(g.degree(customer_id)),
        "graph_salary_sources": float(salary_sources),
        "graph_builder_exposure": float(builder_total / salary_total) if salary_total else 0.0,
        "graph_lender_count": float(lender_count),
        "graph_employer_reach": float(reach),
    }
