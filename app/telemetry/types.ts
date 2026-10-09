export type TelemetryProps = Record<string, string | number | boolean>;

// What oto reports about itself: never book contents, update text or
// anything that identifies the listener.
export type TelemetryEvent =
  | {
      kind: 'error';
      name: string;
      message: string;
      stack?: string;
      at: string;
      props: TelemetryProps;
    }
  | {kind: 'event'; name: string; at: string; props: TelemetryProps}
  | {kind: 'metric'; name: string; value: number; at: string; props: TelemetryProps};

export interface Telemetry {
  error(error: unknown, props?: Record<string, unknown>): void;
  event(name: string, props?: Record<string, unknown>): void;
  metric(name: string, value: number, props?: Record<string, unknown>): void;
}

export type QueuedTelemetryEvent = {id: number; event: TelemetryEvent};

// Holds events until the backend accepts them, keeping only the newest.
export interface TelemetryStore {
  add(event: TelemetryEvent): Promise<void>;
  oldest(limit: number): Promise<QueuedTelemetryEvent[]>;
  remove(ids: number[]): Promise<void>;
}
