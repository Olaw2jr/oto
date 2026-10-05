import type {
  BookId,
  LibraryEntry,
  LibraryStatus,
} from '../../domain';
import type {LibraryRepository} from '../../repositories';
import type {SqlDatabase, SqlRow} from './SqlDatabase';

type LibraryRow = SqlRow & {
  book_id: string;
  status: LibraryStatus;
  position_sec: number;
};

const mapRow = (row: LibraryRow): LibraryEntry => ({
  bookId: row.book_id,
  status: row.status,
  positionSec: row.position_sec,
});

export class SqliteLibraryRepository implements LibraryRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async get(bookId: BookId): Promise<LibraryEntry | null> {
    const rows = await this.db.query<LibraryRow>(
      'SELECT book_id, status, position_sec FROM library_entries WHERE book_id = ? LIMIT 1',
      [bookId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async list(): Promise<LibraryEntry[]> {
    const rows = await this.db.query<LibraryRow>(
      'SELECT book_id, status, position_sec FROM library_entries ORDER BY updated_at DESC, book_id ASC',
    );
    return rows.map(mapRow);
  }

  async save(entry: LibraryEntry): Promise<void> {
    await this.db.execute(
      `INSERT INTO library_entries(book_id, status, position_sec, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(book_id) DO UPDATE SET
         status = excluded.status,
         position_sec = excluded.position_sec,
         updated_at = excluded.updated_at`,
      [entry.bookId, entry.status, entry.positionSec, this.now()],
    );
  }

  async remove(bookId: BookId): Promise<void> {
    await this.db.execute(
      'DELETE FROM library_entries WHERE book_id = ?',
      [bookId],
    );
  }
}
