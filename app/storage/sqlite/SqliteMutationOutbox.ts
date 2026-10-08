import type {
  MutationFailure,
  MutationKind,
  MutationOutbox,
  NewMutation,
  PendingMutation,
} from '../../sync';
import type {SqlDatabase, SqlRow} from './SqlDatabase';

type MutationRow = SqlRow & {
  id: string;
  kind: MutationKind;
  entity_id: string;
  payload_json: string;
  created_at: string;
  attempts: number;
  retry_at: string | null;
  last_error: string | null;
};

const COLUMNS =
  'id, kind, entity_id, payload_json, created_at, attempts, retry_at, last_error';

const mapRow = (row: MutationRow): PendingMutation => ({
  id: row.id,
  kind: row.kind,
  entityId: row.entity_id,
  payload: JSON.parse(row.payload_json),
  createdAt: row.created_at,
  attempts: row.attempts,
  ...(row.retry_at === null ? {} : {retryAt: row.retry_at}),
  ...(row.last_error === null ? {} : {lastError: row.last_error}),
});

// The outbox in `pending_mutations`, so changes waiting to sync survive the
// app being killed. Ready means never failed, or past its retry time.
// Times are compared as instants: ISO strings with and without milliseconds
// don't sort correctly as text.
export class SqliteMutationOutbox implements MutationOutbox {
  constructor(private readonly db: SqlDatabase) {}

  async enqueue(mutation: NewMutation | PendingMutation): Promise<void> {
    const pending = mutation as Partial<PendingMutation>;
    await this.db.execute(
      `INSERT INTO pending_mutations(${COLUMNS})
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         kind = excluded.kind,
         entity_id = excluded.entity_id,
         payload_json = excluded.payload_json,
         created_at = excluded.created_at,
         attempts = CASE WHEN ? THEN excluded.attempts ELSE attempts END,
         retry_at = COALESCE(excluded.retry_at, retry_at),
         last_error = COALESCE(excluded.last_error, last_error)`,
      [
        mutation.id,
        mutation.kind,
        mutation.entityId,
        JSON.stringify(mutation.payload),
        mutation.createdAt,
        pending.attempts ?? 0,
        pending.retryAt ?? null,
        pending.lastError ?? null,
        'attempts' in mutation ? 1 : 0,
      ],
    );
  }

  async get(id: string): Promise<PendingMutation | null> {
    const rows = await this.db.query<MutationRow>(
      `SELECT ${COLUMNS} FROM pending_mutations WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async listReady(now: Date): Promise<PendingMutation[]> {
    const rows = await this.db.query<MutationRow>(
      `SELECT ${COLUMNS} FROM pending_mutations
       WHERE retry_at IS NULL OR julianday(retry_at) <= julianday(?)
       ORDER BY julianday(created_at) ASC, created_at ASC, id ASC`,
      [now.toISOString()],
    );
    return rows.map(mapRow);
  }

  async acknowledge(id: string): Promise<void> {
    await this.db.execute('DELETE FROM pending_mutations WHERE id = ?', [id]);
  }

  async fail(id: string, failure: MutationFailure): Promise<void> {
    await this.db.transaction(async tx => {
      const rows = await tx.query('SELECT id FROM pending_mutations WHERE id = ?', [
        id,
      ]);
      if (!rows.length) {
        throw new Error(`Unknown mutation: ${id}`);
      }
      await tx.execute(
        `UPDATE pending_mutations
         SET attempts = attempts + 1, retry_at = ?, last_error = ?
         WHERE id = ?`,
        [failure.retryAt, failure.error, id],
      );
    });
  }
}
