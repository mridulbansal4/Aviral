"""Financial knowledge graph.

Builds a single networkx graph over the whole population: customers and their
counterparties (employers, builders, lenders, merchants…) linked by aggregated
transaction edges. Shared employers/builders create the cross-customer structure
that graph features and the Relationship Graph screen exploit.
"""

from __future__ import annotations

from dataclasses import dataclass

import networkx as nx

from idbi.domain.enums import CounterpartyType, TransactionCategory
from idbi.domain.models import CustomerRecord

# Which edge semantics each transaction category implies.
_EDGE_TYPE = {
    TransactionCategory.SALARY: "salary_source",
    TransactionCategory.BUILDER_PAYMENT: "financed_by",
    TransactionCategory.EMI: "financed_by",
    TransactionCategory.INVESTMENT: "invests_with",
    TransactionCategory.RENT: "recurring_payment",
}


@dataclass
class GraphNode:
    id: str
    label: str
    kind: str            # "customer" | "counterparty"
    subtype: str         # employment/counterparty type


@dataclass
class GraphEdge:
    source: str
    target: str
    edge_type: str
    total: float
    count: int


class KnowledgeGraph:
    def __init__(self, records: list[CustomerRecord]):
        self.g = nx.Graph()
        self._build(records)

    def _build(self, records: list[CustomerRecord]) -> None:
        for record in records:
            c = record.customer
            self.g.add_node(
                c.id, label=c.name, kind="customer",
                subtype=c.employment_type.value,
            )
            for cp in record.counterparties:
                if not self.g.has_node(cp.id):
                    self.g.add_node(
                        cp.id, label=cp.name, kind="counterparty",
                        subtype=cp.type.value,
                    )
            # Aggregate transactions per counterparty into one edge.
            agg: dict[str, dict] = {}
            for t in record.transactions:
                a = agg.setdefault(
                    t.counterparty_id,
                    {"total": 0.0, "count": 0, "category": t.category},
                )
                a["total"] += t.amount
                a["count"] += 1
            for cp_id, a in agg.items():
                self.g.add_edge(
                    c.id, cp_id,
                    edge_type=_EDGE_TYPE.get(a["category"], "paid_to"),
                    total=round(a["total"], 2),
                    count=a["count"],
                )

    # -- ego graph for visualization ------------------------------------------
    def ego(
        self, customer_id: str, siblings_per_hub: int = 4
    ) -> tuple[list[GraphNode], list[GraphEdge]]:
        """A readable hub-and-spoke: the customer wired to its counterparties,
        plus a few peers attached only to the shared employer/builder hubs.

        We build the edge set explicitly (rather than taking a dense subgraph)
        so the Relationship Graph reads as intelligence, not a hairball.
        """
        if customer_id not in self.g:
            return [], []

        node_ids: set[str] = {customer_id}
        edges: list[GraphEdge] = []

        # 1-hop: the customer to each of its counterparties.
        for cp in self.g.neighbors(customer_id):
            node_ids.add(cp)
            d = self.g.edges[customer_id, cp]
            edges.append(GraphEdge(
                source=customer_id, target=cp,
                edge_type=d["edge_type"], total=d["total"], count=d["count"],
            ))

        # 2-hop: attach a few peers to shared employer/builder hubs only.
        hub_subtypes = {
            CounterpartyType.EMPLOYER.value, CounterpartyType.BUILDER.value
        }
        for cp in list(self.g.neighbors(customer_id)):
            if self.g.nodes[cp]["subtype"] not in hub_subtypes:
                continue
            peers = [
                n for n in self.g.neighbors(cp)
                if self.g.nodes[n]["kind"] == "customer" and n != customer_id
            ][:siblings_per_hub]
            for peer in peers:
                node_ids.add(peer)
                d = self.g.edges[peer, cp]
                edges.append(GraphEdge(
                    source=peer, target=cp,
                    edge_type=d["edge_type"], total=d["total"], count=d["count"],
                ))

        nodes = [
            GraphNode(
                id=n, label=self.g.nodes[n]["label"],
                kind=self.g.nodes[n]["kind"], subtype=self.g.nodes[n]["subtype"],
            )
            for n in node_ids
        ]
        return nodes, edges

    def summary(self) -> dict[str, int]:
        kinds = [d["kind"] for _, d in self.g.nodes(data=True)]
        return {
            "nodes": self.g.number_of_nodes(),
            "edges": self.g.number_of_edges(),
            "customers": kinds.count("customer"),
            "counterparties": kinds.count("counterparty"),
        }
