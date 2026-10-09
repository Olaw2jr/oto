"""POST /v1/telemetry accepts the mobile app's scrubbed telemetry batches."""
import logging

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
AT = "2026-10-09T12:00:00.000Z"


def batch(*events):
    return {"events": list(events)}


def test_route_registered():
    # The OpenAPI schema is stable across FastAPI versions; app.routes isn't.
    assert "post" in app.openapi()["paths"]["/v1/telemetry"]


def test_accepts_errors_events_and_metrics(caplog):
    caplog.set_level(logging.INFO, logger="oto.telemetry")
    response = client.post("/v1/telemetry", json=batch(
        {"kind": "error", "name": "TypeError", "message": "boom", "stack": "at x", "at": AT,
         "props": {"fatal": True, "source": "global"}},
        {"kind": "event", "name": "playback.failed", "at": AT,
         "props": {"reason": "unavailable", "bookId": "book-1"}},
        {"kind": "metric", "name": "startup.ready_ms", "value": 812, "at": AT, "props": {}},
    ))
    assert response.status_code == 202
    assert response.json() == {"accepted": 3}
    assert sum("client_telemetry" in r.message for r in caplog.records) == 3


def test_rejects_nested_or_unknown_data():
    nested = client.post("/v1/telemetry", json=batch(
        {"kind": "event", "name": "x", "at": AT, "props": {"user": {"email": "a@b.c"}}}))
    unknown = client.post("/v1/telemetry", json=batch(
        {"kind": "event", "name": "x", "at": AT, "props": {}, "email": "a@b.c"}))
    assert nested.status_code == 422
    assert unknown.status_code == 422


def test_rejects_oversized_batches_and_values():
    too_many = client.post("/v1/telemetry", json=batch(
        *[{"kind": "event", "name": "x", "at": AT, "props": {}}] * 51))
    long_value = client.post("/v1/telemetry", json=batch(
        {"kind": "event", "name": "x", "at": AT, "props": {"note": "x" * 201}}))
    empty = client.post("/v1/telemetry", json={"events": []})
    assert too_many.status_code == 422
    assert long_value.status_code == 422
    assert empty.status_code == 422
