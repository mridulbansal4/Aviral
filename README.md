# IDBI Adaptive Lending Intelligence

An explainable, adaptive retail-lending intelligence platform. It fuses three
data tracks — Core Banking, Account Aggregator, and PDF narration — into a
verified-income and behavioural-intent view that a Relationship Manager can
read in seconds, with every decision backed by traceable evidence.

This is **V2** of the prototype: the architecture and an honest read of the
requirements (including what was over-scoped or would be misleading in a
prototype) are in [`docs/adr/0001-architecture.md`](docs/adr/0001-architecture.md).

## Monorepo layout

```
apps/api/            FastAPI backend (domain-driven, config-driven)
apps/web/            React + TypeScript + Vite frontend
data/generator/      Seeded, causal synthetic-data generator (M1)
packages/shared-types/  OpenAPI-generated TS types (single source of truth)
docs/                ADRs, model card, confidence spec
```

## Run it

**Backend** (Python 3.12 + [uv](https://docs.astral.sh/uv/)):

```bash
cd apps/api
uv venv --python 3.12
uv pip install -e ".[dev]"
uv run uvicorn idbi.main:app --reload --app-dir src   # → http://127.0.0.1:8000/docs
```

**Frontend** (Node 20+):

```bash
cd apps/web
npm install
npm run dev                                            # → http://localhost:5173
```

## Roadmap

| Milestone | Delivers                                                          |
| --------- | ---------------------------------------------------------------- |
| **M0** ✅ | Monorepo skeleton — API + design-system + Overview, runs green    |
| M1        | Seeded causal synthetic data + feature store (prohibited-feature guard) |
| M2        | Vertical slice: Applicant 360 with real propensity + SHAP        |
| M3        | Temporal & knowledge-graph feature families + their screens      |
| M4        | Confidence algebra + pattern discovery                           |
| M5        | Compliance/consent + offer orchestration                         |
| M6        | Validation dashboard + simulated continuous learning             |

Each milestone leaves the project in a runnable state.
