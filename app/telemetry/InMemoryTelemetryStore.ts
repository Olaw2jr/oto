import type {QueuedTelemetryEvent, TelemetryEvent, TelemetryStore} from './types';

export class InMemoryTelemetryStore implements TelemetryStore {
  private events: QueuedTelemetryEvent[] = [];
  private nextId = 1;

  constructor(private readonly capacity = 500) {}

  async add(event: TelemetryEvent): Promise<void> {
    this.events.push({id: this.nextId++, event});
    if (this.events.length > this.capacity) {
      this.events = this.events.slice(-this.capacity);
    }
  }

  async oldest(limit: number): Promise<QueuedTelemetryEvent[]> {
    return this.events.slice(0, limit);
  }

  async remove(ids: number[]): Promise<void> {
    const gone = new Set(ids);
    this.events = this.events.filter(e => !gone.has(e.id));
  }
}
