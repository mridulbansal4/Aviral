"""M2 tests — the model recovers real signal and the decision is coherent."""

from idbi.rules.engine import get_rules_engine
from idbi.services.decision_service import get_decision_service
from idbi.services.model_service import get_model_service


def test_model_auc_is_real_but_not_perfect():
    """Honest out-of-fold AUC: clearly better than chance, not a leakage 1.0."""
    metrics = get_model_service().metrics
    assert 0.65 < metrics.roc_auc < 0.97
    assert metrics.lift_top_decile > 1.3  # top decile beats base rate


def test_shap_contributions_decompose_prediction():
    """Base value + summed contributions must reconstruct the model margin."""
    import numpy as np

    model = get_model_service()
    contribs, base = model.explain("CUST0000")
    total_logodds = base + sum(c.contribution for c in contribs)
    reconstructed = 1.0 / (1.0 + np.exp(-total_logodds))
    served = model.propensity("CUST0000")
    assert abs(reconstructed - served) < 1e-6


def test_decision_is_coherent():
    decision = get_decision_service().decide("CUST0000")
    assert decision is not None
    assert 0.0 <= decision.propensity <= 1.0
    assert 0.0 <= decision.rule_score <= 1.0
    assert decision.evidence  # SHAP evidence present
    assert decision.band.label
    assert decision.recommended_product in {"home_loan", "personal_loan", "auto_loan"}


def test_rule_score_rewards_a_strong_applicant():
    engine = get_rules_engine()
    strong = {
        "verified_monthly_income": 90000,
        "income_stability": 15.0,
        "dti_ratio": 0.1,
        "savings_momentum": 0.05,
        "salary_growth_3m": 0.1,
        "medical_spend_ratio": 0.0,
    }
    weak = {
        "verified_monthly_income": 20000,
        "income_stability": 2.0,
        "dti_ratio": 0.5,
        "savings_momentum": -0.02,
        "salary_growth_3m": -0.01,
        "medical_spend_ratio": 0.4,
    }
    assert engine.rule_score(engine.evaluate(strong)) > engine.rule_score(
        engine.evaluate(weak)
    )
