"""M1 integrity tests — the properties a bank reviewer would probe."""

import numpy as np
import pytest

from idbi.features.store import FeatureStore, ProhibitedFeatureError
from idbi.synthesis import SyntheticPopulation


def _population():
    return SyntheticPopulation(seed=20260708).generate()


def test_generation_is_deterministic():
    a = SyntheticPopulation(seed=42).generate()
    b = SyntheticPopulation(seed=42).generate()
    assert [r.customer.id for r in a] == [r.customer.id for r in b]
    assert a[0].outcome.latent_probability == b[0].outcome.latent_probability
    assert a[10].transactions[5].amount == b[10].transactions[5].amount


def test_conversion_rate_is_realistic():
    records = _population()
    rate = sum(r.outcome.converted for r in records) / len(records)
    # A believable retail-lending base rate, not everyone / no one.
    assert 0.1 < rate < 0.6


def test_every_customer_has_full_history():
    records = _population()
    for r in records[:20]:
        months = {(t.date.year, t.date.month) for t in r.transactions}
        assert len(months) >= 11  # ~12-month window
        assert any(t.category.value == "salary" for t in r.transactions)


def test_features_recover_signal_without_leakage():
    """Engineered features should predict conversion better than chance, but
    NOT perfectly — perfect separation would mean the label leaked."""
    records = _population()
    store = FeatureStore()
    income_growth, labels = [], []
    for r in records:
        fv = store.build(r)
        # savings_momentum is a known driver; it should correlate with outcome.
        income_growth.append(fv.features["savings_momentum"])
        labels.append(int(r.outcome.converted))
    x, y = np.array(income_growth), np.array(labels)
    # Point-biserial correlation: real but far from deterministic.
    corr = float(np.corrcoef(x, y)[0, 1])
    assert 0.05 < abs(corr) < 0.95


def test_prohibited_features_are_refused():
    store = FeatureStore()
    for banned in ("gender", "religion", "caste", "marital_status"):
        with pytest.raises(ProhibitedFeatureError):
            store.assert_allowed(banned)


def test_no_defined_feature_is_prohibited():
    # Constructing the store validates the whole registry; must not raise.
    store = FeatureStore()
    assert "verified_monthly_income" in store.feature_names()
    assert "gender" not in store.feature_names()
