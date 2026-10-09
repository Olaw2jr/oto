import type {LibraryEntry, ListeningProgress} from '../../app/domain';
import {
  FakeSqlDatabase,
  SqliteCollectionsRepository,
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

  it('upserts and reads rendition-aware listening progress', async () => {
    const db = new FakeSqlDatabase();
    const repository = new SqliteProgressRepository(db, now);
    const progress: ListeningProgress = {
      bookId: 'book-1',
      renditionId: 'rendition-1',
      chapterId: 'chapter-2',
      positionSec: 75,
      durationSec: 120,
    };

    await repository.save(progress);
    db.enqueueQueryRows([
      {
        book_id: 'book-1',
        rendition_id: 'rendition-1',
        chapter_id: 'chapter-2',
        position_sec: 75,
        duration_sec: 120,
      },
    ]);

    await expect(
      repository.get('book-1', 'rendition-1'),
    ).resolves.toEqual(progress);
    expect(db.executed[0].params).toEqual([
      'book-1',
      'rendition-1',
      'chapter-2',
      75,
      120,
      now(),
    ]);
  });
});

describe('SQLite collections repository', () => {
  it('replaces a shelf and its books in one transaction', async () => {
    const db = new FakeSqlDatabase();
    const repository = new SqliteCollectionsRepository(db, now);

    await repository.saveShelf({
      id: 'road-trips',
      name: 'Road trips',
      bookIds: ['book-1', 'book-2'],
    });

    expect(db.transactionCount).toBe(1);
    expect(db.transactionExecuted.map(e => e.params)).toEqual([
      ['road-trips', 'Road trips', now(), now()],
      ['road-trips'],
      ['road-trips', 'book-1', 0, now()],
      ['road-trips', 'book-2', 1, now()],
    ]);
  });
});
