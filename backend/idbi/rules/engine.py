"""Config-driven deterministic rules engine.

Evaluates the rules in ``config/rules.yaml`` against a feature vector and
returns pass/fail results with plain-language rationales, a normalized rule
score, a routed product recommendation, and the propensity band. The engine
contains no policy — only the mechanics of applying it.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import BaseModel

from idbi.config.loader import load_yaml

_OPS = {
    "gte": lambda a, b: a >= b,
    "lte": lambda a, b: a <= b,
    "gt": lambda a, b: a > b,
    "lt": lambda a, b: a < b,
    "eq": lambda a, b: a == b,
}


class RuleResult(BaseModel):
    id: str
    label: str
    feature: str
    passed: bool
    value: float
    threshold: float
    weight: float
    polarity: str
    rationale: str


class Band(BaseModel):
    label: str
    tone: str


def _fmt(value: float) -> str:
    """Human-friendly formatting: currency-ish large numbers, else 2 dp."""
    if abs(value) >= 1000:
        return f"{value:,.0f}"
    return f"{value:.2f}"


class RulesEngine:
    def __init__(self) -> None:
        self._cfg = _load_rules()

    def evaluate(self, features: dict[str, float]) -> list[RuleResult]:
        results: list[RuleResult] = []
        for rule in self._cfg["rules"]:
            value = float(features.get(rule["feature"], 0.0))
            threshold = float(rule["threshold"])
            passed = _OPS[rule["op"]](value, threshold)
            rationale = rule["rationale"].format(
                value=_fmt(value), threshold=_fmt(threshold)
            )
            results.append(RuleResult(
                id=rule["id"],
                label=rule["label"],
                feature=rule["feature"],
                passed=passed,
                value=value,
                threshold=threshold,
                weight=float(rule["weight"]),
                polarity=rule["polarity"],
                rationale=rationale,
            ))
        return results

    def rule_score(self, results: list[RuleResult]) -> float:
        """Weighted share of favourable rules satisfied (0–1).

        Positive rules contribute their weight when passed; negative rules
        contribute their weight when they do NOT fire (i.e. no risk flag).
        """
        total = sum(r.weight for r in results) or 1.0
        earned = 0.0
        for r in results:
            favourable = r.passed if r.polarity == "positive" else not r.passed
            if favourable:
                earned += r.weight
        return min(1.0, earned / total)  # clamp float summation drift

    def route_product(self, features: dict[str, float]) -> str:
        for route in self._cfg.get("product_routing", []):
            value = float(features.get(route["when_feature"], 0.0))
            if _OPS[route["op"]](value, float(route["threshold"])):
                return route["product"]
        return "personal_loan"

    def band(self, propensity: float) -> Band:
        for b in self._cfg["bands"]:
            if propensity >= float(b["min"]):
                return Band(label=b["label"], tone=b["tone"])
        return Band(label="Low propensity", tone="muted")


@lru_cache(maxsize=1)
def _load_rules() -> dict:
    return load_yaml("rules.yaml")


@lru_cache(maxsize=1)
def get_rules_engine() -> RulesEngine:
    return RulesEngine()
