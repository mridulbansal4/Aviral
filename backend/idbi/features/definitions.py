"""Feature definitions.

Each feature is a pure function of a :class:`CustomerRecord`, returning a value
and a human-readable provenance string (surfaced in the UI for explainability).
Adding a feature here is the only way to extend the model's inputs — which is
exactly where the prohibited-feature guard sits.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np

from idbi.domain.enums import Direction, TransactionCategory
from idbi.domain.models import CustomerRecord

# A feature returns (value, provenance).
FeatureFn = Callable[[CustomerRecord], tuple[float, str]]


@dataclass(frozen=True)
class FeatureDef:
    name: str
    fn: FeatureFn
    description: str


def _monthly_series(record: CustomerRecord, category: TransactionCategory) -> np.ndarray:
    """Sum of a category's debit magnitude per month, ordered oldest→newest."""
    by_month: dict[str, float] = {}
    for t in record.transactions:
        if t.category is category:
            key = f"{t.date.year}-{t.date.month:02d}"
            by_month[key] = by_month.get(key, 0.0) + t.amount
    return np.array([by_month[k] for k in sorted(by_month)]) if by_month else np.array([])


def _salary_series(record: CustomerRecord) -> np.ndarray:
    return _monthly_series(record, TransactionCategory.SALARY)


def _verified_income(record: CustomerRecord) -> tuple[float, str]:
    sal = _salary_series(record)
    if sal.size == 0:
        return 0.0, "no salary credits detected"
    val = float(np.median(sal))
    return val, f"median of {sal.size} monthly salary credits"


def _income_stability(record: CustomerRecord) -> tuple[float, str]:
    sal = _salary_series(record)
    if sal.size < 2 or sal.mean() == 0:
        return 0.0, "insufficient salary history"
    cv = float(sal.std() / sal.mean())
    return 1.0 / (cv + 1e-3), f"inverse coefficient of variation (cv={cv:.3f})"


def _salary_growth(record: CustomerRecord) -> tuple[float, str]:
    sal = _salary_series(record)
    if sal.size < 6:
        return 0.0, "insufficient salary history"
    first3, last3 = float(sal[:3].mean()), float(sal[-3:].mean())
    if first3 == 0:
        return 0.0, "no baseline salary"
    return (last3 - first3) / first3, "trailing-3m vs leading-3m salary"


def _net_savings_series(record: CustomerRecord) -> np.ndarray:
    by_month: dict[str, float] = {}
    for t in record.transactions:
        key = f"{t.date.year}-{t.date.month:02d}"
        by_month[key] = by_month.get(key, 0.0) + t.signed_amount
    return np.array([by_month[k] for k in sorted(by_month)]) if by_month else np.array([])


def _savings_momentum(record: CustomerRecord) -> tuple[float, str]:
    net = _net_savings_series(record)
    income, _ = _verified_income(record)
    if net.size < 3 or income == 0:
        return 0.0, "insufficient history"
    slope = float(np.polyfit(np.arange(net.size), net, 1)[0])
    return slope / income, "OLS slope of monthly net savings ÷ income"


def _savings_rate(record: CustomerRecord) -> tuple[float, str]:
    net = _net_savings_series(record)
    income, _ = _verified_income(record)
    if net.size == 0 or income == 0:
        return 0.0, "insufficient history"
    return float(net.mean()) / income, "mean monthly net savings ÷ income"


def _balance_volatility(record: CustomerRecord) -> tuple[float, str]:
    net = _net_savings_series(record)
    income, _ = _verified_income(record)
    if net.size < 2 or income == 0:
        return 0.0, "insufficient history"
    return float(net.std()) / income, "std of monthly net savings ÷ income"


def _category_ratio(category: TransactionCategory) -> FeatureFn:
    def fn(record: CustomerRecord) -> tuple[float, str]:
        income, _ = _verified_income(record)
        if income == 0:
            return 0.0, "no income baseline"
        total = sum(
            t.amount for t in record.transactions
            if t.category is category and t.direction is Direction.DEBIT
        )
        months = max(1, len({f"{t.date.year}-{t.date.month}" for t in record.transactions}))
        return (total / months) / income, f"mean monthly {category.value} spend ÷ income"

    return fn


def _dti_ratio(record: CustomerRecord) -> tuple[float, str]:
    return _category_ratio(TransactionCategory.EMI)(record)


def _builder_recent(record: CustomerRecord) -> tuple[float, str]:
    months_sorted = sorted({f"{t.date.year}-{t.date.month:02d}" for t in record.transactions})
    recent = set(months_sorted[-3:])
    hit = any(
        t.category is TransactionCategory.BUILDER_PAYMENT
        and f"{t.date.year}-{t.date.month:02d}" in recent
        for t in record.transactions
    )
    return (1.0 if hit else 0.0), "builder payment in trailing 3 months"


def _medical_shock(record: CustomerRecord) -> tuple[float, str]:
    hit = any(t.category is TransactionCategory.MEDICAL for t in record.transactions)
    return (1.0 if hit else 0.0), "medical outflow present in window"


def _tenure(record: CustomerRecord) -> tuple[float, str]:
    return float(record.customer.tenure_months), "observed relationship tenure"


# The registry — order defines the model's feature vector layout.
FEATURE_DEFS: list[FeatureDef] = [
    FeatureDef("verified_monthly_income", _verified_income, "Robust median salary credit"),
    FeatureDef("income_stability", _income_stability, "Steadiness of income"),
    FeatureDef("salary_growth_3m", _salary_growth, "Recent income trajectory"),
    FeatureDef("savings_momentum", _savings_momentum, "Trend in monthly savings"),
    FeatureDef("savings_rate", _savings_rate, "Average savings as share of income"),
    FeatureDef("balance_volatility", _balance_volatility, "Cash-flow volatility"),
    FeatureDef("dti_ratio", _dti_ratio, "Debt-service (EMI) to income"),
    FeatureDef("investment_rate", _category_ratio(TransactionCategory.INVESTMENT),
               "SIP/investment as share of income"),
    FeatureDef("discretionary_ratio", _category_ratio(TransactionCategory.DISCRETIONARY),
               "Discretionary spend as share of income"),
    FeatureDef("medical_spend_ratio", _category_ratio(TransactionCategory.MEDICAL),
               "Medical spend as share of income"),
    FeatureDef("builder_payment_recent", _builder_recent, "Active builder payments"),
    FeatureDef("medical_shock", _medical_shock, "Medical liquidity shock"),
    FeatureDef("tenure_months", _tenure, "Relationship tenure"),
]
