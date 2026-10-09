import type {
  QueuedTelemetryEvent,
  TelemetryEvent,
  TelemetryStore,
} from '../../telemetry';
import type {SqlDatabase, SqlRow} from './SqlDatabase';

type Row = SqlRow & {id: number; payload_json: string};

// Telemetry waiting for the backend, kept across restarts. Only the newest
// `capacity` events are kept, so an unreachable backend can't fill storage.
export class SqliteTelemetryStore implements TelemetryStore {
  constructor(
    private readonly db: SqlDatabase,
    private readonly capacity = 500,
  ) {}

  async add(event: TelemetryEvent): Promise<void> {
    await this.db.transaction(async tx => {
      await tx.execute('INSERT INTO telemetry_events(payload_json) VALUES (?)', [
        JSON.stringify(event),
      ]);
      await tx.execute(
        `DELETE FROM telemetry_events WHERE id NOT IN (
           SELECT id FROM telemetry_events ORDER BY id DESC LIMIT ?
         )`,
        [this.capacity],
      );
    });
  }

  async oldest(limit: number): Promise<QueuedTelemetryEvent[]> {
    const rows = await this.db.query<Row>(
      'SELECT id, payload_json FROM telemetry_events ORDER BY id ASC LIMIT ?',
      [limit],
    );
    return rows.map(row => ({id: row.id, event: JSON.parse(row.payload_json)}));
  }

  async remove(ids: number[]): Promise<void> {
    if (!ids.length) return;
    await this.db.execute(
      `DELETE FROM telemetry_events WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids,
    );
  }
}
