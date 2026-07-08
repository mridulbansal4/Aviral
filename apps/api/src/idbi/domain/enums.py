"""Domain enumerations for the lending intelligence platform."""

from __future__ import annotations

from enum import StrEnum


class EmploymentType(StrEnum):
    SALARIED = "salaried"
    SELF_EMPLOYED = "self_employed"


class CityTier(StrEnum):
    """Indian metro classification — affects income and cost-of-living priors."""

    TIER_1 = "tier_1"
    TIER_2 = "tier_2"
    TIER_3 = "tier_3"


class Direction(StrEnum):
    CREDIT = "credit"
    DEBIT = "debit"


class TransactionCategory(StrEnum):
    SALARY = "salary"
    RENT = "rent"
    EMI = "emi"
    UTILITIES = "utilities"
    GROCERIES = "groceries"
    DISCRETIONARY = "discretionary"
    INVESTMENT = "investment"
    MEDICAL = "medical"
    BUILDER_PAYMENT = "builder_payment"
    OTHER = "other"


class CounterpartyType(StrEnum):
    """Node types for the financial knowledge graph (used from M3)."""

    EMPLOYER = "employer"
    MERCHANT = "merchant"
    BUILDER = "builder"
    LENDER = "lender"
    AMC = "amc"  # asset management company (SIP/investment)
    HOSPITAL = "hospital"
    LANDLORD = "landlord"
    UTILITY = "utility"


class LoanType(StrEnum):
    HOME = "home_loan"
    PERSONAL = "personal_loan"
    AUTO = "auto_loan"
    NONE = "none"
