# IDBI Lending Intelligence — API

FastAPI backend for the Adaptive Lending Intelligence Platform.

## Quickstart

```bash
uv venv --python 3.12
uv pip install -e ".[dev]"        # add ",ml" once M1 lands: ".[dev,ml]"
uv run uvicorn idbi.main:app --reload --app-dir src
```

- Health: http://127.0.0.1:8000/api/v1/health
- OpenAPI docs: http://127.0.0.1:8000/docs

## Layout

| Path            | Responsibility                                        |
| --------------- | ----------------------------------------------------- |
| `domain/`       | entities, value objects, DTOs                         |
| `services/`     | application services (ingestion, fusion, decision…)   |
| `ml/`           | propensity model, SHAP, model registry                |
| `graph/`        | financial knowledge graph + graph features            |
| `rules/`        | config-driven trigger plugins                         |
| `repositories/` | data access, swappable behind interfaces              |
| `config/`       | typed settings + YAML (`app.yaml`, `feature_flags.yaml`) |
| `api/v1/`       | versioned HTTP routers                                 |

Nothing that drives lending policy is hardcoded — it lives in `config/`.

## Tests

```bash
uv run pytest -q
```
