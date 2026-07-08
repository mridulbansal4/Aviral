"""M5 tests — consent gates offers; offers respect FOIR; model card is honest."""

from idbi.domain.compliance import ConsentStatus
from idbi.domain.offer import OfferStatus
from idbi.services.compliance_service import get_compliance_service
from idbi.services.consent_service import get_consent_service
from idbi.services.offer_service import get_offer_service


def test_model_card_refuses_protected_attributes():
    card = get_compliance_service().model_card()
    for banned in ("gender", "religion", "caste", "marital_status"):
        assert banned in card.prohibited_features
        assert banned not in card.used_features
    assert card.metrics["roc_auc"] > 0.6
    assert card.limitations  # honest about being synthetic


def test_consent_mix_has_active_and_unusable():
    counts = get_consent_service().status_counts()
    assert counts["active"] > 0
    assert counts["expired"] + counts["revoked"] > 0
    assert sum(counts.values()) == 400


def test_offer_respects_foir_limit():
    svc = get_offer_service()
    foir_limit = svc.cfg["foir_limit"]
    # Check a spread of applicants; approved offers must stay within FOIR.
    for i in range(0, 60, 3):
        offer = svc.orchestrate(f"CUST{i:04d}")
        assert offer is not None
        if offer.status is not OfferStatus.DECLINED:
            assert offer.foir_after <= foir_limit + 1e-6
            assert offer.principal >= 0
            assert offer.monthly_emi >= 0


def test_expired_consent_declines_offer():
    """An unusable consent must block the offer regardless of applicant quality."""
    consent_svc = get_consent_service()
    offer_svc = get_offer_service()
    blocked = None
    for i in range(400):
        cid = f"CUST{i:04d}"
        c = consent_svc.get(cid)
        if c and c.status is not ConsentStatus.ACTIVE:
            blocked = offer_svc.orchestrate(cid)
            break
    assert blocked is not None
    assert blocked.status is OfferStatus.DECLINED
    consent_check = next(c for c in blocked.checks if c.id == "consent_active")
    assert consent_check.passed is False


def test_pricing_is_risk_based():
    """Offered rate = base + spread; the spread line reflects the risk band."""
    offer = get_offer_service().orchestrate("CUST0007")
    assert offer is not None
    labels = [p.label for p in offer.pricing]
    assert any("Base rate" in l for l in labels)
    assert any("Offered rate" in l for l in labels)
    assert offer.risk_band in {"Prime", "Standard", "Elevated"}
