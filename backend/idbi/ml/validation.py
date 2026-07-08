"""Validation primitives: population-stability (PSI) drift and rule precision.

Kept as pure functions so the validation service just orchestrates them.
"""

from __future__ import annotations

import numpy as np


def population_stability_index(
    reference: np.ndarray, current: np.ndarray, bins: int = 10
) -> float:
    """PSI between two samples of one feature.

    Convention: PSI < 0.1 stable, 0.1–0.25 minor shift, > 0.25 material shift.
    Bin edges come from the reference quantiles; a small epsilon avoids log(0).
    """
    ref = reference[np.isfinite(reference)]
    cur = current[np.isfinite(current)]
    if ref.size == 0 or cur.size == 0:
        return 0.0

    edges = np.quantile(ref, np.linspace(0, 1, bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf
    edges = np.unique(edges)
    if edges.size < 3:  # near-constant feature — no meaningful drift
        return 0.0

    ref_hist, _ = np.histogram(ref, bins=edges)
    cur_hist, _ = np.histogram(cur, bins=edges)
    eps = 1e-6
    ref_pct = ref_hist / ref_hist.sum() + eps
    cur_pct = cur_hist / cur_hist.sum() + eps
    return float(np.sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct)))


def drift_status(psi: float) -> str:
    if psi > 0.25:
        return "material"
    if psi > 0.10:
        return "minor"
    return "stable"
