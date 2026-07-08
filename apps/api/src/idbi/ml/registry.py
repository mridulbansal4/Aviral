"""In-memory model registry.

Holds versioned trained models and tracks the active one. A registry (rather
than a module-level global) gives us a clean seam for the continuous-learning
milestone, where retraining produces a new version whose metrics can be compared
against its predecessor.
"""

from __future__ import annotations

from idbi.ml.propensity import TrainedModel
from idbi.observability import get_logger

log = get_logger("idbi.registry")


class ModelRegistry:
    def __init__(self) -> None:
        self._versions: dict[str, TrainedModel] = {}
        self._active: str | None = None

    def register(self, trained: TrainedModel, activate: bool = True) -> None:
        self._versions[trained.version] = trained
        if activate or self._active is None:
            self._active = trained.version
        log.info(
            "model.registered",
            version=trained.version,
            roc_auc=round(trained.metrics.roc_auc, 4),
            active=self._active == trained.version,
        )

    @property
    def active(self) -> TrainedModel:
        if self._active is None:
            raise RuntimeError("No active model registered")
        return self._versions[self._active]

    def get(self, version: str) -> TrainedModel | None:
        return self._versions.get(version)

    def versions(self) -> list[str]:
        return list(self._versions)
