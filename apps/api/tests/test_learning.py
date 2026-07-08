"""M6 tests — validation is coherent; the simulated learning loop advances."""

from idbi.services.learning_service import LearningService
from idbi.services.population_service import get_population_service
from idbi.services.validation_service import get_validation_service


def test_validation_report_is_coherent():
    report = get_validation_service().report()
    assert report.model_metrics.roc_auc > 0.6
    assert report.rules
    # Rule precision/coverage are valid probabilities.
    for r in report.rules:
        assert 0.0 <= r.precision <= 1.0
        assert 0.0 <= r.coverage <= 1.0
    # Family contribution covers base/temporal/graph and sums to ~1.
    fams = {f.family for f in report.family_contribution}
    assert {"base", "temporal", "graph"} <= fams
    total = sum(f.importance_share for f in report.family_contribution)
    assert abs(total - 1.0) < 1e-2


def test_drift_is_reported_honestly():
    report = get_validation_service().report()
    # A stable synthetic population should not be flagged as materially drifting.
    assert report.drift.status in {"stable", "minor"}
    assert report.drift.features


def test_learning_loop_advances_and_is_labelled_simulated():
    svc = LearningService(population=get_population_service(), seed=20260708)
    state = svc.state()
    assert state.simulated is True
    assert state.current_step == 0
    assert len(state.history) == 1
    first_size = state.history[0].train_size

    state = svc.retrain()
    assert state.current_step == 1
    assert len(state.history) == 2
    # More simulated outcomes → a larger training set.
    assert state.history[1].train_size > first_size

    # Held-out set is fixed and never trained on.
    assert state.held_out_size > 0


def test_learning_reaches_final_step_then_stops():
    svc = LearningService(population=get_population_service(), seed=20260708)
    for _ in range(10):
        state = svc.retrain()
    assert state.can_retrain is False
    assert state.current_step == state.steps_total - 1
