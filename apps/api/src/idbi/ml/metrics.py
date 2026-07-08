"""Model evaluation metrics.

Computed from out-of-fold predictions so the headline numbers are honest
(no in-sample optimism). Kept dependency-light: sklearn for AUC, numpy for the
rest.
"""

from __future__ import annotations

import numpy as np
from pydantic import BaseModel
from sklearn.metrics import roc_auc_score


class ModelMetrics(BaseModel):
    roc_auc: float
    ks_statistic: float
    lift_top_decile: float
    base_rate: float
    n_samples: int


def ks_statistic(y_true: np.ndarray, y_score: np.ndarray) -> float:
    """Kolmogorov–Smirnov separation between converters and non-converters."""
    order = np.argsort(y_score)
    y = y_true[order]
    pos_total = y.sum() or 1
    neg_total = (1 - y).sum() or 1
    cum_pos = np.cumsum(y) / pos_total
    cum_neg = np.cumsum(1 - y) / neg_total
    return float(np.max(np.abs(cum_pos - cum_neg)))


def lift_at_decile(y_true: np.ndarray, y_score: np.ndarray, decile: float = 0.1) -> float:
    """Lift of the top-scoring `decile` fraction over the population base rate."""
    n = len(y_true)
    k = max(1, int(n * decile))
    top_idx = np.argsort(y_score)[::-1][:k]
    top_rate = y_true[top_idx].mean()
    base = y_true.mean() or 1e-9
    return float(top_rate / base)


def evaluate(y_true: np.ndarray, y_score: np.ndarray) -> ModelMetrics:
    return ModelMetrics(
        roc_auc=float(roc_auc_score(y_true, y_score)),
        ks_statistic=ks_statistic(y_true, y_score),
        lift_top_decile=lift_at_decile(y_true, y_score),
        base_rate=float(y_true.mean()),
        n_samples=int(len(y_true)),
    )
