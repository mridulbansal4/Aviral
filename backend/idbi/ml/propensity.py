"""LightGBM propensity model with native SHAP.

We deliberately avoid the heavy ``shap`` package: LightGBM's booster computes
*exact* tree SHAP contributions via ``pred_contrib=True``. Contributions are in
log-odds space and sum (with the base value) to the model's raw margin, so every
propensity on screen is fully decomposable into per-feature evidence.
"""

from __future__ import annotations

import warnings
from dataclasses import dataclass

import numpy as np
from lightgbm import LGBMClassifier

# We train and serve exclusively on numpy arrays (columns are positional, kept
# in sync via `feature_names`). LightGBM's default column naming otherwise
# triggers a benign sklearn "valid feature names" warning on predict.
warnings.filterwarnings(
    "ignore",
    message="X does not have valid feature names",
    category=UserWarning,
)

from idbi.ml.metrics import ModelMetrics


@dataclass
class ShapContribution:
    feature: str
    value: float           # the feature's value for this applicant
    contribution: float    # signed log-odds contribution
    direction: str         # "increases" | "decreases"


class PropensityModel:
    """Trains and serves a gradient-boosted propensity model."""

    def __init__(self, feature_names: list[str], seed: int):
        self.feature_names = feature_names
        self.seed = seed
        self.model = LGBMClassifier(
            n_estimators=250,
            learning_rate=0.05,
            num_leaves=16,
            min_child_samples=20,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=1.0,
            random_state=seed,
            n_jobs=1,
            verbosity=-1,
            deterministic=True,
            force_col_wise=True,
        )
        self._trained = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> "PropensityModel":
        self.model.fit(X, y)
        self._trained = True
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)[:, 1]

    def shap_for(self, x_row: np.ndarray) -> tuple[list[ShapContribution], float]:
        """Return per-feature SHAP contributions and the base value for one row."""
        contribs = self.model.booster_.predict(
            x_row.reshape(1, -1), pred_contrib=True
        )[0]
        *feature_contribs, base_value = contribs
        out: list[ShapContribution] = []
        for name, val, contrib in zip(
            self.feature_names, x_row, feature_contribs, strict=True
        ):
            out.append(ShapContribution(
                feature=name,
                value=float(val),
                contribution=float(contrib),
                direction="increases" if contrib >= 0 else "decreases",
            ))
        out.sort(key=lambda c: abs(c.contribution), reverse=True)
        return out, float(base_value)

    def gain_importance(self) -> dict[str, float]:
        gains = self.model.booster_.feature_importance(importance_type="gain")
        total = float(gains.sum()) or 1.0
        return {
            name: float(g) / total
            for name, g in zip(self.feature_names, gains, strict=True)
        }


@dataclass
class TrainedModel:
    """A versioned, trained model plus its evaluation metadata."""

    version: str
    seed: int
    model: PropensityModel
    metrics: ModelMetrics
    feature_names: list[str]
