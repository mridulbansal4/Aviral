"""Smoke tests for the M0 skeleton — proves the app boots and serves."""

from fastapi.testclient import TestClient

from idbi.main import create_app

client = TestClient(create_app())


def test_health_ok():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["version"]


def test_capabilities_exposes_flags():
    resp = client.get("/api/v1/capabilities")
    assert resp.status_code == 200
    flags = resp.json()["flags"]
    # Flags exist and are all off at M0 (features arrive in later milestones).
    assert "knowledge_graph" in flags
    assert all(v is False for v in flags.values())
