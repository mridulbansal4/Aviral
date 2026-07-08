"""Uvicorn entrypoint.

Lets you run the API with a plain, memorable command from this folder:

    uvicorn main:app --reload

The FastAPI application itself lives in ``idbi.main``; this module just
re-exports it so ``main:app`` resolves.
"""

from idbi.main import app

__all__ = ["app"]
