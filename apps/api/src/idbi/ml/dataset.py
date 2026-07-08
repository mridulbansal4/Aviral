"""Assemble the training matrix from guarded feature vectors + outcomes."""

from __future__ import annotations

import numpy as np

from idbi.domain.models import CustomerRecord, FeatureVector


def build_matrix(
    feature_vectors: list[FeatureVector],
    records_by_id: dict[str, CustomerRecord],
    feature_names: list[str],
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Return (X, y, customer_ids) aligned row-for-row."""
    X, y, ids = [], [], []
    for fv in feature_vectors:
        record = records_by_id.get(fv.customer_id)
        if record is None:
            continue
        X.append([fv.features[name] for name in feature_names])
        y.append(int(record.outcome.converted))
        ids.append(fv.customer_id)
    return np.array(X, dtype=float), np.array(y, dtype=int), ids
