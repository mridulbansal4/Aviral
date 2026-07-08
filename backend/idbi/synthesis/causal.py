"""The causal label model.

Separated from transaction synthesis so the ground-truth process is auditable in
one place. Conversion probability is a logistic function of *standardized*
generative drivers plus logit-space noise. Because these drivers are only
observable through noisy transactions, an honest model recovers — but never
perfectly reproduces — this signal.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from idbi.domain.enums import LoanType
from idbi.synthesis.config import LabelConfig

# Continuous drivers are z-scored across the population; binary drivers are used
# as-is (already centred near 0/1).
_CONTINUOUS = ("salary_growth", "savings_momentum", "income_stability", "dti")
_BINARY = ("builder_recent", "medical_shock")


@dataclass
class DriverMatrix:
    """Per-customer generative drivers, keyed by name → array of length N."""

    values: dict[str, np.ndarray]

    def standardized(self) -> dict[str, np.ndarray]:
        out: dict[str, np.ndarray] = {}
        for name, arr in self.values.items():
            if name in _CONTINUOUS:
                mu, sd = float(arr.mean()), float(arr.std()) or 1.0
                out[name] = (arr - mu) / sd
            else:
                out[name] = arr.astype(float)
        return out


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def compute_labels(
    drivers: DriverMatrix,
    config: LabelConfig,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray]:
    """Return ``(converted, latent_probability)`` arrays for the population."""
    std = drivers.standardized()
    n = len(next(iter(std.values())))

    logit = np.full(n, config.bias, dtype=float)
    for name, weight in config.weights.items():
        logit += weight * std[name]
    logit += rng.normal(0.0, config.label_noise, size=n)

    prob = _sigmoid(logit)
    converted = rng.random(n) < prob
    return converted, prob


def assign_loan_types(
    drivers: DriverMatrix,
    converted: np.ndarray,
    priority: list[tuple[str, str]],
) -> list[LoanType]:
    """Assign a loan type to each converter by its dominant standardized driver."""
    std = drivers.standardized()
    loan_types: list[LoanType] = []
    for i, did_convert in enumerate(converted):
        if not did_convert:
            loan_types.append(LoanType.NONE)
            continue
        chosen = LoanType.PERSONAL
        best = -np.inf
        for driver_name, loan_value in priority:
            score = std[driver_name][i]
            if score > best and score > 0:
                best = score
                chosen = LoanType(loan_value)
        loan_types.append(chosen)
    return loan_types
