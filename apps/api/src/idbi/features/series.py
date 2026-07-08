"""Shared monthly-series helpers.

Centralizes the "aggregate transactions into an ordered monthly series"
operation used by both temporal features and the timeline endpoint, so the two
never drift out of sync.
"""

from __future__ import annotations

import numpy as np

from idbi.domain.enums import Direction, TransactionCategory
from idbi.domain.models import CustomerRecord


def month_keys(record: CustomerRecord) -> list[str]:
    keys = {f"{t.date.year}-{t.date.month:02d}" for t in record.transactions}
    return sorted(keys)


def _series(record: CustomerRecord, amounts_for) -> np.ndarray:
    keys = month_keys(record)
    idx = {k: i for i, k in enumerate(keys)}
    out = np.zeros(len(keys))
    for t in record.transactions:
        key = f"{t.date.year}-{t.date.month:02d}"
        out[idx[key]] += amounts_for(t)
    return out


def salary_series(record: CustomerRecord) -> np.ndarray:
    return _series(
        record,
        lambda t: t.amount if t.category is TransactionCategory.SALARY else 0.0,
    )


def total_debit_series(record: CustomerRecord) -> np.ndarray:
    return _series(
        record,
        lambda t: t.amount if t.direction is Direction.DEBIT else 0.0,
    )


def net_series(record: CustomerRecord) -> np.ndarray:
    return _series(record, lambda t: t.signed_amount)


def category_debit_series(
    record: CustomerRecord, category: TransactionCategory
) -> np.ndarray:
    return _series(
        record,
        lambda t: t.amount
        if t.category is category and t.direction is Direction.DEBIT
        else 0.0,
    )


def slope(series: np.ndarray) -> float:
    """OLS slope over the ordered series; 0 if too short."""
    if series.size < 2:
        return 0.0
    return float(np.polyfit(np.arange(series.size), series, 1)[0])
