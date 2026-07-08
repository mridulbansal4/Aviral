"""Model service.

Trains the propensity model once at startup and serves predictions + SHAP.
Metrics are computed from 5-fold **out-of-fold** predictions (honest, no
in-sample optimism); the served model is then fit on all data for the best
per-applicant estimate. Both facts are surfaced to the UI.
"""

from __future__ import annotations

from functools import lru_cache

import numpy as np
from sklearn.base import clone
from sklearn.model_selection import StratifiedKFold, cross_val_predict

from idbi.ml import ModelMetrics, PropensityModel, TrainedModel, evaluate
from idbi.ml.dataset import build_matrix
from idbi.ml.propensity import ShapContribution
from idbi.ml.registry import ModelRegistry
from idbi.observability import get_logger
from idbi.services.population_service import PopulationService, get_population_service

log = get_logger("idbi.model")


class ModelService:
    def __init__(self, population: PopulationService, seed: int):
        self.population = population
        self.seed = seed
        self.registry = ModelRegistry()
        self.feature_names = population.feature_store.feature_names()
        self._index: dict[str, int] = {}
        self._X: np.ndarray = np.empty((0, 0))
        self._train_and_register()

    def _train_and_register(self) -> None:
        records = {r.customer.id: r for r in self.population.repository.all()}
        X, y, ids = build_matrix(
            self.population.all_features(), records, self.feature_names
        )
        self._X = X
        self._index = {cid: i for i, cid in enumerate(ids)}

        model = PropensityModel(self.feature_names, seed=self.seed)

        # Honest metrics from out-of-fold predictions.
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=self.seed)
        oof = cross_val_predict(
            clone(model.model), X, y, cv=cv, method="predict_proba", n_jobs=1
        )[:, 1]
        metrics: ModelMetrics = evaluate(y, oof)

        # Final fit on all data for serving.
        model.fit(X, y)
        trained = TrainedModel(
            version=f"propensity-v1.{self.seed}",
            seed=self.seed,
            model=model,
            metrics=metrics,
            feature_names=self.feature_names,
        )
        self.registry.register(trained)
        log.info(
            "model.trained",
            version=trained.version,
            roc_auc=round(metrics.roc_auc, 4),
            ks=round(metrics.ks_statistic, 4),
            lift=round(metrics.lift_top_decile, 2),
        )

    # -- serving ---------------------------------------------------------------
    @property
    def metrics(self) -> ModelMetrics:
        return self.registry.active.metrics

    @property
    def version(self) -> str:
        return self.registry.active.version

    def _row(self, customer_id: str) -> np.ndarray | None:
        idx = self._index.get(customer_id)
        return None if idx is None else self._X[idx]

    def propensity(self, customer_id: str) -> float | None:
        row = self._row(customer_id)
        if row is None:
            return None
        return float(self.registry.active.model.predict_proba(row.reshape(1, -1))[0])

    def explain(
        self, customer_id: str
    ) -> tuple[list[ShapContribution], float] | None:
        row = self._row(customer_id)
        if row is None:
            return None
        return self.registry.active.model.shap_for(row)

    def gain_importance(self) -> dict[str, float]:
        return self.registry.active.model.gain_importance()


@lru_cache(maxsize=1)
def get_model_service() -> ModelService:
    from idbi.config import get_settings

    return ModelService(
        population=get_population_service(), seed=get_settings().data.seed
    )
