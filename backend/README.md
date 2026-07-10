# IDBI Lending Intelligence — API

FastAPI backend for the Adaptive Lending Intelligence Platform.

## Quickstart

One-time setup:

```bash
uv venv --python 3.12
uv pip install -e ".[dev]"
```

Then run the API (either form works):

```bash
uv run uvicorn main:app --reload           # no venv activation needed
# —or— activate the venv first, then the bare command:
#   source .venv/Scripts/activate   (Windows Git Bash)
#   .venv\Scripts\activate          (Windows PowerShell)
uvicorn main:app --reload
```

- Health: http://127.0.0.1:8000/api/v1/health
- OpenAPI docs: http://127.0.0.1:8000/docs

## Layout

`main.py` is the uvicorn entrypoint (re-exports `idbi.main:app`); everything
else lives under the `idbi/` package:

| Path                 | Responsibility                                        |
| -------------------- | ----------------------------------------------------- |
| `idbi/domain/`       | entities, value objects, DTOs                         |
| `idbi/services/`     | application services (fusion, decision, offers…)      |
| `idbi/ml/`           | propensity model, SHAP, patterns, registry            |
| `idbi/graph/`        | financial knowledge graph + graph features            |
| `idbi/features/`     | guarded feature store + families                      |
| `idbi/rules/`        | config-driven rules engine                            |
| `idbi/synthesis/`    | seeded causal data generator                          |
| `idbi/repositories/` | data access, swappable behind interfaces              |
| `config/`            | YAML config (rules, products, confidence, flags…)     |
| `idbi/api/v1/`       | versioned HTTP routers                                 |

Nothing that drives lending policy is hardcoded — it lives in `config/`.

## Tests

```bash
uv run pytest -q
```
