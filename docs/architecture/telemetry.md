# Telemetry (HA-06)

oto reports problems about itself to its own backend through a vendor-neutral
`Telemetry` interface (`app/telemetry`). No third-party SDK is involved.

## What is recorded

| Kind | Examples | Source |
|---|---|---|
| `error` | Uncaught JS errors (`fatal`, `source: 'global'`), playback errors (`source: 'player'`), library write failures (`source: 'library.save'`) | `installGlobalErrorReporting`, `PlayerProvider`, `LibraryProvider` |
| `event` | `playback.failed` (`reason: unavailable \| failed`, `bookId`), `playback.stopped` (`reason: native-error`) | `PlayerProvider` |
| `metric` | `startup.ready_ms`: JS start to providers ready, once per launch | `reportStartup` (`app/telemetry/startup.ts`) |

## Privacy rules

- Properties keep only short primitives: strings are cut to 200 characters,
  numbers must be finite, and objects and arrays are dropped (`sanitizeProps`).
  Nested data that could hold personal details never leaves the device.
- Error messages are cut to 300 characters and stacks to 20 lines.
- No user identifiers, update text, comments or listening history beyond the
  public catalogue `bookId` of a failed playback.

## Delivery

- `QueuedTelemetry` writes events to a `TelemetryStore` and never throws.
  `SqliteTelemetryStore` (migration 4) keeps the newest 500 across restarts.
- `TelemetryUploader` sends batches of 50, oldest first, to
  `POST /v1/telemetry` through `ApiClient` + `FetchHttpTransport`. It runs only
  while online, on start and on reconnect, and retries failures with the sync
  engine's backoff. Events are removed only after the backend accepts them.
- The uploader starts only when `app/config/environment.ts#apiBaseUrl` is set.
