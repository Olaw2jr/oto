import type {LibraryEntry, ListeningProgress} from '../../app/domain';
import {
  FakeSqlDatabase,
  SqliteLibraryRepository,
  SqliteProgressRepository,
} from '../../app/storage/sqlite';

const now = () => '2026-10-05T12:00:00.000Z';

describe('SQLite library repositories', () => {
  it('upserts and reads a library entry', async () => {
    const db = new FakeSqlDatabase();
    const repository = new SqliteLibraryRepository(db, now);
    const entry: LibraryEntry = {
      bookId: 'book-1',
      status: 'listening',
      positionSec: 42,
    };

    await repository.save(entry);
    db.enqueueQueryRows([
      {
        book_id: 'book-1',
        status: 'listening',
        position_sec: 42,
      },
    ]);

    await expect(repository.get('book-1')).resolves.toEqual(entry);

    expect(db.executed[0]).toMatchObject({
      params: ['book-1', 'listening', 42, now()],
    });
    expect(db.executed[0].sql).toContain('ON CONFLICT(book_id) DO UPDATE');
  });

  it('lists library entries and removes by book id', async () => {
    const db = new FakeSqlDatabase();
    const repository = new SqliteLibraryRepository(db, now);
    db.enqueueQueryRows([
      {book_id: 'book-1', status: 'want', position_sec: 0},
      {book_id: 'book-2', status: 'finished', position_sec: 100},
    ]);

    await expect(repository.list()).resolves.toEqual([
      {bookId: 'book-1', status: 'want', positionSec: 0},
      {bookId: 'book-2', status: 'finished', positionSec: 100},
    ]);

    await repository.remove('book-1');
    expect(db.executed.at(-1)).toEqual({
      sql: 'DELETE FROM library_entries WHERE book_id = ?',
      params: ['book-1'],
    });
  });

  it('returns null for a missing library entry', async () => {
    const db = new FakeSqlDatabase();
    const repository = new SqliteLibraryRepository(db, now);
    db.enqueueQueryRows([]);

    await expect(repository.get('missing')).resolves.toBeNull();
  });

  it('upserts and reads listening progress', async () => {
    const db = new FakeSqlDatabase();
    const repository = new SqliteProgressRepository(db, now);
    const progress: ListeningProgress = {
      bookId: 'book-1',
      positionSec: 75,
      durationSec: 120,
    };

    await repository.save(progress);
    db.enqueueQueryRows([
      {book_id: 'book-1', position_sec: 75, duration_sec: 120},
    ]);

    await expect(repository.get('book-1')).resolves.toEqual(progress);
    expect(db.executed[0]).toMatchObject({
      params: ['book-1', 75, 120, now()],
    });
    expect(db.executed[0].sql).toContain('ON CONFLICT(book_id) DO UPDATE');
  });
});
