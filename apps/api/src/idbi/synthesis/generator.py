"""Seeded synthetic population generator.

Produces a reproducible population of customers with 12 months of transaction
history, shared counterparties (employers, builders, hospitals…) so the
knowledge graph has real structure later, and ground-truth outcomes drawn from
the causal model in :mod:`idbi.synthesis.causal`.

Determinism: every random draw comes from a single seeded ``numpy`` generator,
so a given seed always yields byte-identical data — the basis for reproducible
metrics on screen.
"""

from __future__ import annotations

from datetime import date, timedelta

import numpy as np

from idbi.domain.enums import (
    CityTier,
    CounterpartyType,
    Direction,
    EmploymentType,
    TransactionCategory,
)
from idbi.domain.models import (
    Counterparty,
    Customer,
    CustomerRecord,
    Outcome,
    SensitiveAttributes,
    Transaction,
)
from idbi.synthesis.causal import DriverMatrix, assign_loan_types, compute_labels
from idbi.synthesis.config import GeneratorConfig

# Window anchored to a fixed date so history is reproducible (no wall-clock).
WINDOW_END = date(2026, 6, 30)

_GENDERS = ["female", "male", "other"]
_RELIGIONS = ["hindu", "muslim", "christian", "sikh", "other"]
_MARITAL = ["single", "married"]
_FIRST = ["Aarav", "Diya", "Kabir", "Ananya", "Vivaan", "Isha", "Rohan", "Meera",
          "Arjun", "Sara", "Aditya", "Riya", "Kiaan", "Nisha", "Dev", "Tara"]
_LAST = ["Sharma", "Iyer", "Khan", "Reddy", "Nair", "Bose", "Gupta", "Menon",
         "Rao", "Das", "Verma", "Pillai"]


class SyntheticPopulation:
    """Generates and holds one reproducible population."""

    def __init__(self, seed: int, config: GeneratorConfig | None = None):
        self.seed = seed
        self.config = config or GeneratorConfig.load()
        self.rng = np.random.default_rng(seed)

    # -- counterparty pools (shared across customers → graph structure) --------
    def _build_pools(self) -> dict[CounterpartyType, list[Counterparty]]:
        n = self.config.population.size
        spec = {
            CounterpartyType.EMPLOYER: (max(6, n // 10), "ACME Corp,Infoedge,TCS,Wipro,Zomato,Flipkart,Reliance,HDFC,Byju,Paytm,Ola,Swiggy"),
            CounterpartyType.BUILDER: (10, "Prestige,Godrej Prop,Lodha,DLF,Sobha,Brigade,Purva,Mahindra Life"),
            CounterpartyType.HOSPITAL: (12, "Apollo,Fortis,Manipal,Max,Medanta,Narayana,AIIMS,Columbia Asia"),
            CounterpartyType.MERCHANT: (20, "BigBazaar,DMart,Amazon,Reliance Fresh,More,Blinkit,Zepto,Nykaa"),
            CounterpartyType.AMC: (8, "HDFC MF,ICICI Pru,SBI MF,Axis MF,Nippon,Kotak MF"),
            CounterpartyType.LENDER: (10, "HDFC Bank,Bajaj Fin,ICICI Bank,IDBI Bank,SBI,Axis Bank"),
            CounterpartyType.UTILITY: (6, "BESCOM,Tata Power,Airtel,Jio,BSNL,Adani Gas"),
        }
        pools: dict[CounterpartyType, list[Counterparty]] = {}
        for cp_type, (count, names) in spec.items():
            name_list = names.split(",")
            pools[cp_type] = [
                Counterparty(
                    id=f"{cp_type.value}_{i}",
                    name=name_list[i % len(name_list)],
                    type=cp_type,
                )
                for i in range(count)
            ]
        return pools

    def _pick(self, pool: list[Counterparty]) -> Counterparty:
        return pool[int(self.rng.integers(len(pool)))]

    # -- income prior ----------------------------------------------------------
    def _base_income(self, emp: EmploymentType, city: CityTier) -> float:
        prior = (
            self.config.income.salaried
            if emp is EmploymentType.SALARIED
            else self.config.income.self_employed
        )
        base = float(np.exp(self.rng.normal(prior.log_mean, prior.log_sigma)))
        return base * self.config.income.city_multiplier[city.value]

    # -- one customer ----------------------------------------------------------
    def _generate_customer(
        self, idx: int, pools: dict[CounterpartyType, list[Counterparty]]
    ) -> tuple[CustomerRecord, dict[str, float]]:
        rng = self.rng
        cfg = self.config
        months = cfg.population.history_months

        emp = EmploymentType.SALARIED if rng.random() < 0.72 else EmploymentType.SELF_EMPLOYED
        city = CityTier(rng.choice(["tier_1", "tier_2", "tier_3"], p=[0.4, 0.38, 0.22]))
        age = int(rng.integers(23, 58))
        tenure = int(min(months, rng.integers(6, 120)))
        discipline = float(rng.beta(*cfg.latent.discipline))
        home_intent = rng.random() < cfg.latent.home_intent_rate
        medical_shock = rng.random() < cfg.latent.medical_shock_rate

        base_income = self._base_income(emp, city)
        # Income stability: salaried steadier; discipline adds steadiness.
        income_cv = (0.04 if emp is EmploymentType.SALARIED else 0.16) + 0.12 * (1 - discipline)
        # Salary growth: a step-up partway through the window for some customers.
        growth_rate = float(rng.normal(0.06, 0.09))  # window-total growth
        step_month = int(rng.integers(3, months - 1))

        employer = self._pick(pools[CounterpartyType.EMPLOYER])
        has_emi = rng.random() < 0.45
        lender = self._pick(pools[CounterpartyType.LENDER]) if has_emi else None
        dti = float(rng.uniform(0.05, 0.42)) if has_emi else 0.0
        is_renter = rng.random() < (0.6 if city is CityTier.TIER_1 else 0.4)
        landlord = Counterparty(
            id=f"landlord_{idx}", name="Landlord", type=CounterpartyType.LANDLORD
        )
        invests = rng.random() < (0.3 + 0.5 * discipline)
        amc = self._pick(pools[CounterpartyType.AMC]) if invests else None
        builder = self._pick(pools[CounterpartyType.BUILDER]) if home_intent else None
        hospital = self._pick(pools[CounterpartyType.HOSPITAL]) if medical_shock else None

        txns: list[Transaction] = []
        used_cps: dict[str, Counterparty] = {employer.id: employer}
        monthly_salary: list[float] = []
        monthly_net: list[float] = []
        cid = f"CUST{idx:04d}"

        def add(m: int, day: int, amt: float, direction: Direction,
                cat: TransactionCategory, cp: Counterparty, narr: str) -> None:
            used_cps[cp.id] = cp
            month_start = WINDOW_END.replace(day=1) - timedelta(days=30 * (months - 1 - m))
            txns.append(Transaction(
                id=f"{cid}_{m:02d}_{len(txns):03d}",
                customer_id=cid,
                date=month_start.replace(day=min(day, 28)),
                amount=round(abs(amt), 2),
                direction=direction,
                category=cat,
                counterparty_id=cp.id,
                counterparty_type=cp.type,
                narration=narr,
            ))

        builder_recent = 0
        medical_recent = 0
        for m in range(months):
            grow = 1.0 + growth_rate * (0.0 if m < step_month else 1.0)
            salary = base_income * grow * float(rng.normal(1.0, income_cv))
            salary = max(salary, base_income * 0.5)
            monthly_salary.append(salary)
            add(m, 2, salary, Direction.CREDIT, TransactionCategory.SALARY, employer,
                f"NEFT CR SALARY {employer.name.upper()}")

            debits = 0.0
            if has_emi and lender is not None:
                emi = base_income * dti
                add(m, 5, emi, Direction.DEBIT, TransactionCategory.EMI, lender,
                    f"ACH DR EMI {lender.name.upper()}")
                debits += emi
            if is_renter:
                rent = base_income * float(rng.uniform(0.18, 0.3))
                add(m, 6, rent, Direction.DEBIT, TransactionCategory.RENT, landlord,
                    "UPI DR RENT LANDLORD")
                debits += rent
            if invests and amc is not None:
                sip = base_income * 0.06 * (0.5 + discipline)
                add(m, 7, sip, Direction.DEBIT, TransactionCategory.INVESTMENT, amc,
                    f"SIP DR {amc.name.upper()}")
                debits += sip
            util_cp = self._pick(pools[CounterpartyType.UTILITY])
            util = base_income * float(rng.uniform(0.02, 0.05))
            add(m, 10, util, Direction.DEBIT, TransactionCategory.UTILITIES, util_cp,
                f"BILLPAY {util_cp.name.upper()}")
            debits += util
            groc_cp = self._pick(pools[CounterpartyType.MERCHANT])
            groc = base_income * float(rng.uniform(0.08, 0.16))
            add(m, 14, groc, Direction.DEBIT, TransactionCategory.GROCERIES, groc_cp,
                f"UPI {groc_cp.name.upper()}")
            debits += groc
            disc = base_income * float(rng.uniform(0.05, 0.28)) * (1.4 - discipline)
            disc_cp = self._pick(pools[CounterpartyType.MERCHANT])
            add(m, 20, disc, Direction.DEBIT, TransactionCategory.DISCRETIONARY, disc_cp,
                f"CARD {disc_cp.name.upper()}")
            debits += disc

            # Builder payments accumulate in the last 4 months for home-intent.
            if home_intent and builder is not None and m >= months - 4:
                bp = base_income * float(rng.uniform(0.4, 0.9))
                add(m, 22, bp, Direction.DEBIT, TransactionCategory.BUILDER_PAYMENT,
                    builder, f"RTGS DR {builder.name.upper()} BOOKING")
                debits += bp
                if m >= months - 3:
                    builder_recent = 1
            # Medical shock: one spike in a recent month.
            if medical_shock and hospital is not None and m == months - 2:
                med = base_income * float(rng.uniform(0.6, 1.5))
                add(m, 18, med, Direction.DEBIT, TransactionCategory.MEDICAL, hospital,
                    f"CARD {hospital.name.upper()} HOSPITAL")
                debits += med
                medical_recent = 1

            monthly_net.append(salary - debits)

        # Generative drivers (observed via the transactions above).
        sal = np.array(monthly_salary)
        net = np.array(monthly_net)
        first3, last3 = sal[:3].mean(), sal[-3:].mean()
        salary_growth = float((last3 - first3) / first3)
        income_stability = float(1.0 / (sal.std() / sal.mean() + 1e-3))
        savings_momentum = float(np.polyfit(np.arange(months), net, 1)[0] / base_income)

        record = CustomerRecord(
            customer=Customer(
                id=cid,
                name=f"{_FIRST[idx % len(_FIRST)]} {_LAST[idx % len(_LAST)]}",
                age=age,
                employment_type=emp,
                city_tier=city,
                tenure_months=tenure,
                sensitive=SensitiveAttributes(
                    gender=str(rng.choice(_GENDERS)),
                    religion=str(rng.choice(_RELIGIONS)),
                    marital_status=str(rng.choice(_MARITAL)),
                ),
            ),
            transactions=txns,
            counterparties=list(used_cps.values()),
            outcome=Outcome(converted=False, loan_type="none", latent_probability=0.0),
        )
        drivers = {
            "salary_growth": salary_growth,
            "savings_momentum": savings_momentum,
            "income_stability": income_stability,
            "builder_recent": float(builder_recent),
            "medical_shock": float(medical_recent),
            "dti": dti,
        }
        return record, drivers

    # -- whole population ------------------------------------------------------
    def generate(self) -> list[CustomerRecord]:
        pools = self._build_pools()
        records: list[CustomerRecord] = []
        driver_lists: dict[str, list[float]] = {}
        for idx in range(self.config.population.size):
            record, drivers = self._generate_customer(idx, pools)
            records.append(record)
            for k, v in drivers.items():
                driver_lists.setdefault(k, []).append(v)

        matrix = DriverMatrix({k: np.array(v) for k, v in driver_lists.items()})
        converted, prob = compute_labels(matrix, self.config.label, self.rng)
        loan_types = assign_loan_types(
            matrix, converted, self.config.loan_type_priority
        )
        for rec, conv, p, lt in zip(records, converted, prob, loan_types, strict=True):
            rec.outcome = Outcome(
                converted=bool(conv), loan_type=lt, latent_probability=float(p)
            )
        return records
