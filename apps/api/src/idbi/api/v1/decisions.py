"""Decision and model endpoints (M2)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from idbi.domain.decision import Decision
from idbi.ml.metrics import ModelMetrics
from idbi.services.decision_service import DecisionService, get_decision_service
from idbi.services.model_service import ModelService, get_model_service

router = APIRouter(tags=["decisions"])

DecisionDep = Annotated[DecisionService, Depends(get_decision_service)]
ModelDep = Annotated[ModelService, Depends(get_model_service)]


@router.get("/applicants/{customer_id}/decision", response_model=Decision)
def get_decision(customer_id: str, service: DecisionDep) -> Decision:
    decision = service.decide(customer_id)
    if decision is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return decision


class ModelCard(BaseModel):
    version: str
    metrics: ModelMetrics
    feature_importance: dict[str, float]


@router.get("/model/card", response_model=ModelCard)
def model_card(model: ModelDep) -> ModelCard:
    """Model version, honest out-of-fold metrics, and gain-based importance."""
    return ModelCard(
        version=model.version,
        metrics=model.metrics,
        feature_importance=model.gain_importance(),
    )
