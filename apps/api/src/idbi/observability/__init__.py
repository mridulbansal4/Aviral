"""Observability: structured logging (and, later, metrics/tracing hooks)."""

from idbi.observability.logging import configure_logging, get_logger

__all__ = ["configure_logging", "get_logger"]
