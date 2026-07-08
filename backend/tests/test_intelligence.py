"""M4 tests — confidence algebra is well-defined; patterns are honest."""

from idbi.services.confidence_service import get_confidence_service
from idbi.services.pattern_service import get_pattern_service


def test_confidence_dimensions_and_aggregate():
    report = get_confidence_service().report("CUST0000")
    assert report is not None
    keys = {d.key for d in report.dimensions}
    assert keys == {"data", "model", "graph", "pattern", "temporal"}
    # Each dimension is a valid probability-like score.
    for d in report.dimensions:
        assert 0.0 <= d.value <= 1.0
        assert d.inputs  # provenance present
    # Decision confidence equals the config-weighted sum of dimensions
    # (both sides are 4-dp rounded, so allow rounding slack).
    expected = sum(d.value * d.weight for d in report.dimensions)
    assert abs(report.decision_confidence - expected) < 1e-3
    assert 0.0 <= report.decision_confidence <= 1.0


def test_weights_sum_to_one():
    report = get_confidence_service().report("CUST0000")
    assert report is not None
    total_weight = sum(d.weight for d in report.dimensions)
    assert abs(total_weight - 1.0) < 1e-6


def test_patterns_discovered_and_significant():
    patterns = get_pattern_service().patterns()
    assert len(patterns) >= 3
    # Support covers the whole population.
    assert sum(p.support for p in patterns) == 400
    # At least one clearly-converting and one clearly-not pattern emerge.
    assert any(p.significant and p.precision > 0.5 for p in patterns)
    assert any(p.significant and p.precision < 0.3 for p in patterns)
    # Every pattern is described by defining features.
    for p in patterns:
        assert p.defining_features


def test_pattern_match_is_consistent():
    svc = get_pattern_service()
    match = svc.match("CUST0000")
    assert match is not None
    assert 0.0 <= match.membership <= 1.0
    # The matched pattern must be one of the discovered patterns.
    assert match.pattern_id in {p.id for p in svc.patterns()}
