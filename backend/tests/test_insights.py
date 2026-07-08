"""M3 tests — temporal + graph families integrate honestly."""

from idbi.config.loader import is_enabled
from idbi.services.insight_service import get_insight_service
from idbi.services.model_service import get_model_service
from idbi.services.population_service import get_population_service


def test_m3_flags_enabled():
    assert is_enabled("temporal_features")
    assert is_enabled("knowledge_graph")


def test_feature_vector_includes_all_families():
    fv = get_population_service().features("CUST0000")
    assert fv is not None
    # base + temporal + graph families all present
    assert "verified_monthly_income" in fv.features        # base
    assert "temporal_income_trend" in fv.features           # temporal
    assert "graph_builder_exposure" in fv.features          # graph


def test_graph_features_never_prohibited():
    store = get_population_service().feature_store
    for name in store.feature_names():
        store.assert_allowed(name)  # must not raise


def test_model_still_honest_with_more_features():
    """Adding families keeps AUC in an honest band (no leakage from graph)."""
    m = get_model_service().metrics
    assert 0.65 < m.roc_auc < 0.97


def test_knowledge_graph_has_shared_hubs():
    kg = get_population_service().graph
    assert kg is not None
    summary = kg.summary()
    # Far fewer counterparties than customers → hubs are genuinely shared.
    assert summary["counterparties"] < summary["customers"]
    assert summary["edges"] > summary["customers"]


def test_timeline_and_graph_projections():
    svc = get_insight_service()
    tl = svc.timeline("CUST0000")
    assert tl is not None and len(tl.points) >= 11
    assert tl.metrics

    g = svc.graph("CUST0000")
    assert g is not None
    assert any(n.is_focus for n in g.nodes)  # the applicant is in the graph
    assert g.edges
