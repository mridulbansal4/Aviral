"""Temporal feature family (M3).

Rolling-window signals over the 12-month sequence that add momentum and
seasonality context beyond the point-in-time base features. Each is a pure
function of one record and feeds the same propensity model.
"""

from __future__ import annotations

import numpy as np

from idbi.domain.enums import TransactionCategory
from idbi.domain.models import CustomerRecord
from idbi.features.definitions import FeatureDef, _verified_income
from idbi.features.series import (
    category_debit_series,
    net_series,
    slope,
    total_debit_series,
)


def _spending_momentum(record: CustomerRecord) -> tuple[float, str]:
    spend = total_debit_series(record)
    income, _ = _verified_income(record)
    if spend.size < 3 or income == 0:
        return 0.0, "insufficient history"
    return slope(spend) / income, "OLS slope of monthly outflow ÷ income"


def _savings_acceleration(record: CustomerRecord) -> tuple[float, str]:
    """Second-order trend: is the savings trend itself improving?"""
    net = net_series(record)
    income, _ = _verified_income(record)
    if net.size < 4 or income == 0:
        return 0.0, "insufficient history"
    half = net.size // 2
    early = slope(net[:half])
    late = slope(net[half:])
    return (late - early) / income, "late-window vs early-window savings slope"


def _income_trend(record: CustomerRecord) -> tuple[float, str]:
    from idbi.features.series import salary_series

    sal = salary_series(record)
    if sal.size < 3 or sal.mean() == 0:
        return 0.0, "insufficient salary history"
    return slope(sal) / sal.mean(), "OLS slope of monthly salary ÷ mean salary"


def _discretionary_seasonality(record: CustomerRecord) -> tuple[float, str]:
    """Peakiness of discretionary spend — high means lumpy, event-driven spend."""
    disc = category_debit_series(record, TransactionCategory.DISCRETIONARY)
    if disc.size < 3 or disc.mean() == 0:
        return 0.0, "insufficient discretionary history"
    return float(disc.max() / disc.mean()), "peak ÷ mean monthly discretionary spend"


def _volatility_trend(record: CustomerRecord) -> tuple[float, str]:
    """Is cash-flow becoming more or less volatile over the window?"""
    net = net_series(record)
    income, _ = _verified_income(record)
    if net.size < 4 or income == 0:
        return 0.0, "insufficient history"
    half = net.size // 2
    return (float(net[half:].std()) - float(net[:half].std())) / income, (
        "late-window vs early-window cash-flow dispersion"
    )


TEMPORAL_FEATURE_DEFS: list[FeatureDef] = [
    FeatureDef("temporal_spending_momentum", _spending_momentum,
               "Trend in monthly outflow"),
    FeatureDef("temporal_savings_acceleration", _savings_acceleration,
               "Whether the savings trend is improving"),
    FeatureDef("temporal_income_trend", _income_trend,
               "Direction of monthly income"),
    FeatureDef("temporal_discretionary_seasonality", _discretionary_seasonality,
               "Peakiness of discretionary spend"),
    FeatureDef("temporal_volatility_trend", _volatility_trend,
               "Change in cash-flow volatility"),
]
