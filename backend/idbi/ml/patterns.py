"""Unsupervised pattern discovery.

Clusters customers on a behavioural feature subset (KMeans), then characterizes
each cluster by its conversion rate, support, dominant loan type, and defining
features. Crucially, the outcome is used only to *describe* clusters after they
are formed — never to form them — so a high-conversion cluster is a genuine
discovery, not a relabelling of the target.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from sklearn.cluster import KMeans

from idbi.domain.enums import LoanType

# Short, human phrases for defining-feature descriptions (direction-aware).
_PHRASES = {
    "salary_growth_3m": ("Rising income", "Flat/declining income"),
    "savings_momentum": ("Building savings", "Drawing down savings"),
    "income_stability": ("Stable income", "Volatile income"),
    "dti_ratio": ("High debt load", "Low debt load"),
    "builder_payment_recent": ("Active builder payments", "No builder activity"),
    "medical_spend_ratio": ("Elevated medical spend", "Low medical spend"),
    "temporal_spending_momentum": ("Accelerating spend", "Moderating spend"),
    "discretionary_ratio": ("High discretionary spend", "Frugal discretionary"),
}


@dataclass
class DefiningFeature:
    feature: str
    z: float               # cluster centroid in population-standardized units
    phrase: str


@dataclass
class Pattern:
    id: int
    label: str
    support: int
    precision: float       # conversion rate within the cluster
    lift: float            # precision ÷ base rate
    dominant_loan_type: LoanType
    significant: bool
    defining_features: list[DefiningFeature] = field(default_factory=list)
    example_customer_ids: list[str] = field(default_factory=list)


class PatternDiscovery:
    def __init__(self, feature_subset: list[str], k: int, seed: int, margin: float):
        self.feature_subset = feature_subset
        self.k = k
        self.seed = seed
        self.margin = margin
        self._mean: np.ndarray | None = None
        self._std: np.ndarray | None = None
        self._km: KMeans | None = None
        self.patterns: list[Pattern] = []
        self._label_by_cluster: dict[int, str] = {}

    def _standardize(self, X: np.ndarray) -> np.ndarray:
        return (X - self._mean) / self._std

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        loan_types: list[LoanType],
        customer_ids: list[str],
    ) -> "PatternDiscovery":
        self._mean = X.mean(axis=0)
        self._std = X.std(axis=0)
        self._std[self._std == 0] = 1.0
        Z = self._standardize(X)

        self._km = KMeans(n_clusters=self.k, random_state=self.seed, n_init=10)
        assign = self._km.fit_predict(Z)
        base_rate = float(y.mean())

        patterns: list[Pattern] = []
        for c in range(self.k):
            idx = np.where(assign == c)[0]
            if idx.size == 0:
                continue
            centroid = self._km.cluster_centers_[c]  # already in std space
            precision = float(y[idx].mean())
            lift = precision / base_rate if base_rate else 0.0

            # Dominant loan type among converters in the cluster.
            conv_loans = [
                loan_types[i] for i in idx if loan_types[i] is not LoanType.NONE
            ]
            dominant = (
                max(set(conv_loans), key=conv_loans.count)
                if conv_loans
                else LoanType.NONE
            )

            defining = sorted(
                (
                    DefiningFeature(
                        feature=self.feature_subset[j],
                        z=float(centroid[j]),
                        phrase=self._phrase(self.feature_subset[j], centroid[j]),
                    )
                    for j in range(len(self.feature_subset))
                ),
                key=lambda d: abs(d.z),
                reverse=True,
            )[:3]

            label = " · ".join(d.phrase for d in defining)
            self._label_by_cluster[c] = label
            patterns.append(Pattern(
                id=c,
                label=label,
                support=int(idx.size),
                precision=precision,
                lift=lift,
                dominant_loan_type=dominant,
                significant=abs(precision - base_rate) >= self.margin,
                defining_features=defining,
                example_customer_ids=[customer_ids[i] for i in idx[:5]],
            ))

        patterns.sort(key=lambda p: p.precision, reverse=True)
        self.patterns = patterns
        return self

    def _phrase(self, feature: str, z: float) -> str:
        high, low = _PHRASES.get(feature, (f"High {feature}", f"Low {feature}"))
        return high if z >= 0 else low

    def assign(self, x_row: np.ndarray) -> tuple[int, float]:
        """Return (cluster_id, membership_strength ∈ [0,1]).

        Membership is how dominant the nearest centroid is versus the rest,
        derived from a softmax over negative distances and rescaled so a uniform
        assignment maps to 0 and an unambiguous one to 1.
        """
        assert self._km is not None
        z = self._standardize(x_row.reshape(1, -1))[0]
        dists = np.linalg.norm(self._km.cluster_centers_ - z, axis=1)
        nearest = int(np.argmin(dists))
        probs = np.exp(-dists)
        probs /= probs.sum()
        top = float(probs.max())
        strength = (top - 1.0 / self.k) / (1.0 - 1.0 / self.k)
        return nearest, max(0.0, min(1.0, strength))

    def pattern_for(self, cluster_id: int) -> Pattern | None:
        for p in self.patterns:
            if p.id == cluster_id:
                return p
        return None
