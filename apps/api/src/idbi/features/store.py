"""Feature store.

The single boundary through which raw customer data becomes model-ready
features. Its most important job is the **prohibited-feature guard**: every
feature name is checked against the RBI fair-lending registry
(``config/prohibited_features.yaml``) before it can enter a feature vector.
Compliance is enforced in code here, not left to reviewer vigilance.
"""

from __future__ import annotations

from functools import lru_cache

from idbi.config.loader import load_yaml
from idbi.domain.models import CustomerRecord, FeatureVector
from idbi.features.definitions import FEATURE_DEFS
from idbi.observability import get_logger

log = get_logger("idbi.features")


class ProhibitedFeatureError(ValueError):
    """Raised when a prohibited (protected-attribute) feature is introduced."""


@lru_cache(maxsize=1)
def _prohibited() -> frozenset[str]:
    return frozenset(load_yaml("prohibited_features.yaml").get("prohibited", []))


@lru_cache(maxsize=1)
def _review_required() -> frozenset[str]:
    return frozenset(load_yaml("prohibited_features.yaml").get("review_required", []))


class FeatureStore:
    """Computes and guards feature vectors."""

    def __init__(self) -> None:
        self.prohibited = _prohibited()
        self.review_required = _review_required()
        self._validate_registry()

    def _validate_registry(self) -> None:
        """Fail fast at startup if any defined feature is prohibited."""
        for defn in FEATURE_DEFS:
            self.assert_allowed(defn.name)

    def assert_allowed(self, name: str) -> None:
        if name in self.prohibited:
            raise ProhibitedFeatureError(
                f"Feature '{name}' is prohibited under fair-lending policy and "
                f"cannot be used as a model input."
            )

    def feature_names(self) -> list[str]:
        return [d.name for d in FEATURE_DEFS]

    def build(self, record: CustomerRecord) -> FeatureVector:
        features: dict[str, float] = {}
        provenance: dict[str, str] = {}
        for defn in FEATURE_DEFS:
            self.assert_allowed(defn.name)  # defence in depth
            value, prov = defn.fn(record)
            features[defn.name] = float(value)
            provenance[defn.name] = prov
        return FeatureVector(
            customer_id=record.customer.id,
            features=features,
            provenance=provenance,
        )

    def compliance_manifest(self) -> dict[str, list[str]]:
        """What the store uses, refuses, and flags — for the compliance view."""
        return {
            "used_features": self.feature_names(),
            "prohibited": sorted(self.prohibited),
            "review_required": sorted(self.review_required),
        }
