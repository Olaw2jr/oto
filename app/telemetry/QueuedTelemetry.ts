import {describeError, sanitizeProps} from './sanitize';
import type {Telemetry, TelemetryEvent, TelemetryStore} from './types';

// Records events into a store for the uploader to send. Reporting must
// never break the app, so failures to store are swallowed.
export class QueuedTelemetry implements Telemetry {
  private writes: Promise<void> = Promise.resolve();
  private readonly now: () => string;

  constructor(
    private readonly store: TelemetryStore,
    options: {now?: () => string} = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  error(error: unknown, props?: Record<string, unknown>): void {
    this.record({
      kind: 'error',
      ...describeError(error),
      at: this.now(),
      props: sanitizeProps(props),
    });
  }

  event(name: string, props?: Record<string, unknown>): void {
    this.record({kind: 'event', name, at: this.now(), props: sanitizeProps(props)});
  }

  metric(name: string, value: number, props?: Record<string, unknown>): void {
    this.record({
      kind: 'metric',
      name,
      value,
      at: this.now(),
      props: sanitizeProps(props),
    });
  }

  // Resolves once everything recorded so far has been stored.
  idle(): Promise<void> {
    return this.writes;
  }

  private record(event: TelemetryEvent): void {
    this.writes = this.writes
      .then(() => this.store.add(event))
      .catch(() => {});
  }
}

// For tests and places with nothing to report to.
export const noopTelemetry: Telemetry = {
  error: () => {},
  event: () => {},
  metric: () => {},
};
