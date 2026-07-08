"""Core domain models.

Pydantic models are the contract between layers. Sensitive attributes on
:class:`Customer` (gender, religion) exist *only* to prove the feature store's
prohibited-feature guard refuses to use them — they never reach a model.
"""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field

from idbi.domain.enums import (
    CityTier,
    CounterpartyType,
    Direction,
    EmploymentType,
    LoanType,
    TransactionCategory,
)


class Counterparty(BaseModel):
    """A graph node the customer transacts with (employer, builder, merchant…)."""

    id: str
    name: str
    type: CounterpartyType


class Transaction(BaseModel):
    id: str
    customer_id: str
    date: date
    amount: float  # positive magnitude; sign is conveyed by `direction`
    direction: Direction
    category: TransactionCategory
    counterparty_id: str
    counterparty_type: CounterpartyType
    narration: str  # raw bank narration text — feeds Narration Intelligence later

    @property
    def signed_amount(self) -> float:
        return self.amount if self.direction is Direction.CREDIT else -self.amount


class SensitiveAttributes(BaseModel):
    """Attributes that MUST NOT influence a lending decision (RBI fair lending).

    Kept on a separate object so it is structurally obvious what is off-limits.
    The feature store never reads from here.
    """

    gender: str
    religion: str
    marital_status: str


class Customer(BaseModel):
    id: str
    name: str
    age: int
    employment_type: EmploymentType
    city_tier: CityTier
    tenure_months: int  # months of relationship / employment history observed
    sensitive: SensitiveAttributes


class Outcome(BaseModel):
    """Ground-truth label from the synthetic causal process (M1 only)."""

    converted: bool
    loan_type: LoanType
    # The latent probability the causal model drew from — used to validate that
    # engineered features recover signal without leaking the label.
    latent_probability: float


class CustomerRecord(BaseModel):
    """Everything known about one customer: profile, transactions, counterparties."""

    customer: Customer
    transactions: list[Transaction]
    counterparties: list[Counterparty]
    outcome: Outcome


class FeatureVector(BaseModel):
    """Model-ready features for one customer, plus provenance for explainability."""

    customer_id: str
    features: dict[str, float]
    # Which raw signals each feature came from — surfaced in the UI later.
    provenance: dict[str, str] = Field(default_factory=dict)


class ApplicantSummary(BaseModel):
    """Compact view for list screens."""

    customer_id: str
    name: str
    age: int
    employment_type: EmploymentType
    city_tier: CityTier
    verified_monthly_income: float
    converted: bool
    loan_type: LoanType
