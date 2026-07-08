"""Typed schema for ``config/generator.yaml``."""

from __future__ import annotations

from pydantic import BaseModel

from idbi.config.loader import load_yaml


class IncomePrior(BaseModel):
    log_mean: float
    log_sigma: float


class IncomeConfig(BaseModel):
    salaried: IncomePrior
    self_employed: IncomePrior
    city_multiplier: dict[str, float]


class LatentConfig(BaseModel):
    discipline: tuple[float, float]
    home_intent_rate: float
    medical_shock_rate: float


class LabelConfig(BaseModel):
    bias: float
    weights: dict[str, float]
    label_noise: float


class PopulationConfig(BaseModel):
    size: int
    history_months: int


class GeneratorConfig(BaseModel):
    population: PopulationConfig
    income: IncomeConfig
    latent: LatentConfig
    label: LabelConfig
    loan_type_priority: list[tuple[str, str]]

    @classmethod
    def load(cls) -> "GeneratorConfig":
        return cls(**load_yaml("generator.yaml"))
