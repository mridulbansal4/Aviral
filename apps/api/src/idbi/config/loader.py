"""YAML configuration loading.

Small, dependency-light helpers for reading the ``config/*.yaml`` files. Kept
separate from :mod:`idbi.config.settings` so the loading mechanism and the typed
schema evolve independently.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

# apps/api/  (three parents up from apps/api/src/idbi/config/loader.py)
API_ROOT = Path(__file__).resolve().parents[3]
CONFIG_DIR = API_ROOT / "config"


def load_yaml(name: str) -> dict[str, Any]:
    """Load ``config/<name>`` as a dict. Returns ``{}`` for an empty file."""
    path = CONFIG_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found: {path}")
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return data or {}


@lru_cache(maxsize=None)
def feature_flags() -> dict[str, bool]:
    """Return the feature-flag map, cached for the process lifetime."""
    return dict(load_yaml("feature_flags.yaml").get("flags", {}))


def is_enabled(flag: str) -> bool:
    """True if ``flag`` is present and truthy in ``feature_flags.yaml``."""
    return bool(feature_flags().get(flag, False))
