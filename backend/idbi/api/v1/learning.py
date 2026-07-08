"""Validation and Continuous-Learning endpoints (M6)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from idbi.domain.validation import LearningState, ValidationReport
from idbi.services.learning_service import LearningService, get_learning_service
from idbi.services.validation_service import (
    ValidationService,
    get_validation_service,
)

router = APIRouter(tags=["validation"])

ValidationDep = Annotated[ValidationService, Depends(get_validation_service)]
LearningDep = Annotated[LearningService, Depends(get_learning_service)]


@router.get("/validation/report", response_model=ValidationReport)
def validation_report(service: ValidationDep) -> ValidationReport:
    return service.report()


@router.get("/learning/state", response_model=LearningState)
def learning_state(service: LearningDep) -> LearningState:
    return service.state()


@router.post("/learning/retrain", response_model=LearningState)
def learning_retrain(service: LearningDep) -> LearningState:
    """Incorporate the next batch of simulated outcomes and re-evaluate."""
    return service.retrain()


@router.post("/learning/reset", response_model=LearningState)
def learning_reset(service: LearningDep) -> LearningState:
    return service.reset()
