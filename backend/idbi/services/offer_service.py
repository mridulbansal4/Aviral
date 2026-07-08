"""Offer orchestration.

Turns a decision into a concrete, compliant loan offer using real retail-lending
mechanics: an income-multiple cap, a FOIR (fixed-obligations-to-income) cap via
the standard annuity formula, risk-based pricing by confidence band, and a
hard consent gate. Every number is explained (which cap bound the principal,
how the rate was priced) and every eligibility check is surfaced.
"""

from __future__ import annotations

from functools import lru_cache

from idbi.config.loader import load_yaml
from idbi.domain.compliance import ConsentStatus
from idbi.domain.offer import (
    EligibilityCheck,
    Offer,
    OfferStatus,
    PricingLine,
)
from idbi.services.confidence_service import (
    ConfidenceService,
    get_confidence_service,
)
from idbi.services.consent_service import ConsentService, get_consent_service
from idbi.services.decision_service import DecisionService, get_decision_service
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)


def _annuity_pv(payment: float, monthly_rate: float, n: int) -> float:
    """Present value of an annuity — max principal for a given EMI capacity."""
    if payment <= 0 or n <= 0:
        return 0.0
    if monthly_rate == 0:
        return payment * n
    return payment * (1 - (1 + monthly_rate) ** -n) / monthly_rate


def _emi(principal: float, monthly_rate: float, n: int) -> float:
    if principal <= 0 or n <= 0:
        return 0.0
    if monthly_rate == 0:
        return principal / n
    return principal * monthly_rate / (1 - (1 + monthly_rate) ** -n)


class OfferService:
    def __init__(
        self,
        population: PopulationService,
        decisions: DecisionService,
        confidence: ConfidenceService,
        consent: ConsentService,
    ):
        self.population = population
        self.decisions = decisions
        self.confidence = confidence
        self.consent = consent
        self.cfg = load_yaml("products.yaml")

    def _risk_band(self, decision_confidence: float) -> tuple[str, float]:
        for band in self.cfg["risk_pricing"]:
            if decision_confidence >= float(band["min_confidence"]):
                return band["label"], float(band["spread"])
        return "Elevated", 0.03

    def orchestrate(self, customer_id: str) -> Offer | None:
        fv = self.population.features(customer_id)
        decision = self.decisions.decide(customer_id)
        report = self.confidence.report(customer_id)
        consent = self.consent.get(customer_id)
        if fv is None or decision is None or report is None or consent is None:
            return None

        income = fv.features["verified_monthly_income"]
        existing = fv.features.get("dti_ratio", 0.0) * income
        foir_before = existing / income if income else 0.0
        foir_limit = float(self.cfg["foir_limit"])
        min_income = float(self.cfg["min_monthly_income"])

        product_key = decision.recommended_product
        product = self.cfg["products"].get(
            product_key, self.cfg["products"]["personal_loan"]
        )

        band_label, spread = self._risk_band(report.decision_confidence)
        annual_rate = round(float(product["base_rate"]) + spread, 4)
        r = annual_rate / 12
        tenure = max(product["tenure_months"])  # longest tenure → max capacity

        headroom_emi = max(0.0, foir_limit * income - existing)
        cap_foir = _annuity_pv(headroom_emi, r, tenure)
        cap_income = income * float(product["max_income_multiple"])
        principal = max(0.0, min(cap_foir, cap_income))
        principal = float(int(principal // 10000) * 10000)  # round to ₹10k
        emi = _emi(principal, r, tenure)
        foir_after = (existing + emi) / income if income else 1.0

        checks = [
            EligibilityCheck(
                id="consent_active",
                label="Active AA consent",
                passed=consent.is_usable,
                detail=f"Consent {consent.status.value} "
                       f"(valid to {consent.expires_on.isoformat()}).",
            ),
            EligibilityCheck(
                id="min_income",
                label="Minimum income",
                passed=income >= min_income,
                detail=f"Verified income ₹{income:,.0f} vs floor ₹{min_income:,.0f}.",
            ),
            EligibilityCheck(
                id="min_principal",
                label="Viable principal",
                passed=principal >= float(product["min_principal"]),
                detail=f"Eligible principal ₹{principal:,.0f} vs product minimum "
                       f"₹{float(product['min_principal']):,.0f}.",
            ),
            EligibilityCheck(
                id="foir_within_limit",
                label="FOIR within limit",
                passed=foir_after <= foir_limit + 1e-9,
                detail=f"Post-EMI FOIR {foir_after:.0%} vs limit {foir_limit:.0%}.",
            ),
        ]

        status = self._status(checks, report.decision_confidence)

        return Offer(
            customer_id=customer_id,
            product=product_key,
            product_label=product["label"],
            status=status,
            principal=principal,
            tenure_months=tenure,
            annual_rate=annual_rate,
            monthly_emi=round(emi, 2),
            foir_before=round(foir_before, 4),
            foir_after=round(foir_after, 4),
            risk_band=band_label,
            decision_confidence=report.decision_confidence,
            max_principal_by_income=round(cap_income, 2),
            max_principal_by_foir=round(cap_foir, 2),
            consent_status=consent.status,
            pricing=[
                PricingLine(label="Base rate", value=f"{product['base_rate']:.2%}"),
                PricingLine(
                    label=f"Risk spread ({band_label})",
                    value=f"{spread:+.2%}",
                ),
                PricingLine(label="Offered rate", value=f"{annual_rate:.2%}"),
            ],
            checks=checks,
        )

    def _status(
        self, checks: list[EligibilityCheck], decision_confidence: float
    ) -> OfferStatus:
        if not all(c.passed for c in checks):
            return OfferStatus.DECLINED
        # All hard checks pass — refer thin-confidence cases for manual review.
        if decision_confidence < 0.45:
            return OfferStatus.REFERRED
        return OfferStatus.APPROVED_IN_PRINCIPLE


@lru_cache(maxsize=1)
def get_offer_service() -> OfferService:
    return OfferService(
        population=get_population_service(),
        decisions=get_decision_service(),
        confidence=get_confidence_service(),
        consent=get_consent_service(),
    )
