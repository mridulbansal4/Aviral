"""Structured logging setup.

One place to configure ``structlog`` so every service emits consistent,
machine-parseable events. Development uses a readable console renderer;
production uses JSON.
"""

from __future__ import annotations

import logging
import sys

import structlog

from idbi.config.settings import LoggingConfig


def configure_logging(config: LoggingConfig) -> None:
    """Configure the stdlib root logger and structlog from ``config``."""
    level = getattr(logging, config.level.upper(), logging.INFO)

    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=level)

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    renderer = (
        structlog.processors.JSONRenderer()
        if config.renderer == "json"
        else structlog.dev.ConsoleRenderer()
    )

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Return a bound structlog logger."""
    return structlog.get_logger(name)
