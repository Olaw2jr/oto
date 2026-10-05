import type {
  BookId,
  ListeningProgress,
} from '../../domain';
import type {ProgressRepository} from '../../repositories';
import type {SqlDatabase, SqlRow} from './SqlDatabase';

type ProgressRow = SqlRow & {
  book_id: string;
  position_sec: number;
  duration_sec: number;
};

const mapRow = (row: ProgressRow): ListeningProgress => ({
  bookId: row.book_id,
  positionSec: row.position_sec,
  durationSec: row.duration_sec,
});

export class SqliteProgressRepository implements ProgressRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async get(bookId: BookId): Promise<ListeningProgress | null> {
    const rows = await this.db.query<ProgressRow>(
      'SELECT book_id, position_sec, duration_sec FROM listening_progress WHERE book_id = ? LIMIT 1',
      [bookId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async save(progress: ListeningProgress): Promise<void> {
    await this.db.execute(
      `INSERT INTO listening_progress(book_id, position_sec, duration_sec, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(book_id) DO UPDATE SET
         position_sec = excluded.position_sec,
         duration_sec = excluded.duration_sec,
         updated_at = excluded.updated_at`,
      [
        progress.bookId,
        progress.positionSec,
        progress.durationSec,
        this.now(),
      ],
    );
  }
}
