"""Client telemetry ingest for the mobile app (HA-06).

The app sends batches of scrubbed events to POST /v1/telemetry
(app/telemetry/TelemetryUploader.ts). Events are validated against the same
limits the client applies — short primitive properties only, truncated
messages and stacks, no unknown fields — then written as structured logs
next to the request audit log. Nothing is stored in the database.
"""
import json
import logging
from datetime import datetime
from typing import Annotated, Literal, Union

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictFloat, StrictInt

log = logging.getLogger("oto.telemetry")

Name = Annotated[str, Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_.:-]+$")]
PropKey = Annotated[str, Field(min_length=1, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")]
PropValue = Union[StrictBool, StrictInt, StrictFloat, Annotated[str, Field(max_length=200)]]


class _Event(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Name
    at: datetime
    props: dict[PropKey, PropValue] = Field(default_factory=dict, max_length=20)


class ErrorEvent(_Event):
    kind: Literal["error"]
    message: str = Field(max_length=300)
    stack: str | None = Field(default=None, max_length=8000)


class NamedEvent(_Event):
    kind: Literal["event"]


class MetricEvent(_Event):
    kind: Literal["metric"]
    value: float


TelemetryEvent = Annotated[Union[ErrorEvent, NamedEvent, MetricEvent], Field(discriminator="kind")]


class TelemetryBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    events: list[TelemetryEvent] = Field(min_length=1, max_length=50)


router = APIRouter(prefix="/v1/telemetry", tags=["telemetry"])


@router.post("", status_code=202)
async def ingest(batch: TelemetryBatch) -> dict:
    for event in batch.events:
        log.info("client_telemetry %s", json.dumps(event.model_dump(mode="json"), sort_keys=True))
    return {"accepted": len(batch.events)}
