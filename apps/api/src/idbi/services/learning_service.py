"""Continuous-learning service (SIMULATED).

Demonstrates the closed loop honestly. A fixed held-out test set is never
trained on. Each "retrain" incorporates more of a training pool — standing in
for outcomes accumulating over time — and re-evaluates on the same held-out set,
so the before/after metric deltas are real. The outcomes are simulated and the
service says so via ``LearningState.simulated``; it never touches the live
serving model.
"""

from __future__ import annotations

from functools import lru_cache

import numpy as np
from sklearn.model_selection import train_test_split

from idbi.domain.validation import LearningState, LearningStep
from idbi.ml import PropensityModel, evaluate
from idbi.ml.dataset import build_matrix
from idbi.observability import get_logger
from idbi.services.population_service import (
    PopulationService,
    get_population_service,
)

log = get_logger("idbi.learning")

# Cumulative share of the training pool available at each simulated round.
_SCHEDULE = [
    (0.40, "Initial book (40%)"),
    (0.60, "+ Quarter 1 outcomes"),
    (0.80, "+ Quarter 2 outcomes"),
    (1.00, "+ Quarter 3 outcomes"),
]


class LearningService:
    def __init__(self, population: PopulationService, seed: int):
        self.seed = seed
        self.feature_names = population.feature_store.feature_names()
        records = {r.customer.id: r for r in population.repository.all()}
        X, y, _ = build_matrix(
            population.all_features(), records, self.feature_names
        )

        # Fixed held-out test set — never trained on.
        self.pool_X, self.test_X, self.pool_y, self.test_y = train_test_split(
            X, y, test_size=0.25, random_state=seed, stratify=y
        )
        self._order = np.random.default_rng(seed).permutation(len(self.pool_X))

        self.history: list[LearningStep] = []
        self.current_step = 0
        self._train_step(0)

    def _train_step(self, step: int) -> LearningStep:
        fraction, label = _SCHEDULE[step]
        take = max(20, int(fraction * len(self.pool_X)))
        idx = self._order[:take]
        model = PropensityModel(self.feature_names, seed=self.seed)
        model.fit(self.pool_X[idx], self.pool_y[idx])
        scores = model.predict_proba(self.test_X)
        m = evaluate(self.test_y, scores)
        entry = LearningStep(
            step=step, label=label, train_size=int(take),
            roc_auc=round(m.roc_auc, 4),
            ks_statistic=round(m.ks_statistic, 4),
            lift_top_decile=round(m.lift_top_decile, 3),
        )
        self.history.append(entry)
        log.info("learning.step", step=step, train_size=take, roc_auc=entry.roc_auc)
        return entry

    def state(self) -> LearningState:
        return LearningState(
            held_out_size=int(len(self.test_X)),
            total_pool=int(len(self.pool_X)),
            steps_total=len(_SCHEDULE),
            current_step=self.current_step,
            can_retrain=self.current_step < len(_SCHEDULE) - 1,
            history=list(self.history),
        )

    def retrain(self) -> LearningState:
        """Incorporate the next batch of simulated outcomes and re-evaluate."""
        if self.current_step < len(_SCHEDULE) - 1:
            self.current_step += 1
            self._train_step(self.current_step)
        return self.state()

    def reset(self) -> LearningState:
        self.history = []
        self.current_step = 0
        self._train_step(0)
        return self.state()


@lru_cache(maxsize=1)
def get_learning_service() -> LearningService:
    from idbi.config import get_settings

    return LearningService(
        population=get_population_service(), seed=get_settings().data.seed
    )
