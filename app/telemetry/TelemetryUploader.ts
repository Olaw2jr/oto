import type {ApiClient} from '../api';
import type {Connectivity} from '../connectivity';
import {retryDelayMs} from '../sync';
import type {TelemetryEvent, TelemetryStore} from './types';

export const TELEMETRY_PATH = '/v1/telemetry';

type UploaderOptions = {
  store: TelemetryStore;
  connectivity: Connectivity;
  api: Pick<ApiClient, 'post'>;
  batchSize?: number;
  schedule?: (run: () => void, delayMs: number) => () => void;
  random?: () => number;
};

// Sends queued telemetry to the backend in batches, oldest first, while
// online. Events stay queued until the backend accepts them.
export class TelemetryUploader {
  private running: Promise<void> | null = null;
  private failures = 0;
  private cancelRetry: (() => void) | null = null;

  constructor(private readonly options: UploaderOptions) {}

  flush(): Promise<void> {
    this.running ??= this.drain().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  async idle(): Promise<void> {
    await this.running;
  }

  // Flushes now and whenever the connection comes back.
  start(): () => void {
    const {connectivity} = this.options;
    let online = connectivity.current().online;
    const stop = connectivity.subscribe(state => {
      const reconnected = state.online && !online;
      online = state.online;
      if (reconnected) this.flush().catch(() => {});
    });
    this.flush().catch(() => {});
    return () => {
      stop();
      this.cancelRetry?.();
    };
  }

  private async drain(): Promise<void> {
    const {store, connectivity, api} = this.options;
    const batchSize = this.options.batchSize ?? 50;
    while (connectivity.current().online) {
      const batch = await store.oldest(batchSize);
      if (!batch.length) return;
      try {
        await api.post<unknown, {events: TelemetryEvent[]}>(TELEMETRY_PATH, {
          events: batch.map(item => item.event),
        });
      } catch {
        this.retryLater();
        return;
      }
      this.failures = 0;
      await store.remove(batch.map(item => item.id));
    }
  }

  private retryLater(): void {
    this.failures += 1;
    const schedule = this.options.schedule;
    if (!schedule) return;
    this.cancelRetry?.();
    this.cancelRetry = schedule(
      () => this.flush().catch(() => {}),
      retryDelayMs(this.failures, this.options.random ?? Math.random),
    );
  }
}
