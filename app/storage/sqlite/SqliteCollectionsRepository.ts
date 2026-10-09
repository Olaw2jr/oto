import type {
  BookId,
  PersonalCollections,
  ShelfRecord,
} from '../../domain';
import type {CollectionsRepository} from '../../repositories';
import type {SqlDatabase, SqlRow} from './SqlDatabase';

type RatingRow = SqlRow & {book_id: string; rating: number};
type ShelfRow = SqlRow & {id: string; name: string};
type ShelfBookRow = SqlRow & {shelf_id: string; book_id: string};
type BookmarkRow = SqlRow & {book_id: string; at_sec: number};

export class SqliteCollectionsRepository implements CollectionsRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async load(): Promise<PersonalCollections> {
    const ratings = await this.db.query<RatingRow>(
      'SELECT book_id, rating FROM ratings',
    );
    const shelves = await this.db.query<ShelfRow>(
      'SELECT id, name FROM shelves ORDER BY created_at ASC, rowid ASC',
    );
    const shelfBooks = await this.db.query<ShelfBookRow>(
      'SELECT shelf_id, book_id FROM shelf_books ORDER BY position ASC',
    );
    const bookmarks = await this.db.query<BookmarkRow>(
      'SELECT book_id, at_sec FROM bookmarks ORDER BY at_sec ASC',
    );

    const marks: Record<BookId, number[]> = {};
    for (const row of bookmarks) {
      (marks[row.book_id] ??= []).push(row.at_sec);
    }
    return {
      ratings: Object.fromEntries(ratings.map(r => [r.book_id, r.rating])),
      shelves: shelves.map(shelf => ({
        id: shelf.id,
        name: shelf.name,
        bookIds: shelfBooks
          .filter(row => row.shelf_id === shelf.id)
          .map(row => row.book_id),
      })),
      bookmarks: marks,
    };
  }

  async saveRating(bookId: BookId, stars: number | null): Promise<void> {
    if (stars === null) {
      await this.db.execute('DELETE FROM ratings WHERE book_id = ?', [bookId]);
      return;
    }
    await this.db.execute(
      `INSERT INTO ratings(book_id, rating, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(book_id) DO UPDATE SET
         rating = excluded.rating,
         updated_at = excluded.updated_at`,
      [bookId, stars, this.now()],
    );
  }

  async saveShelf(shelf: ShelfRecord): Promise<void> {
    const at = this.now();
    await this.db.transaction(async tx => {
      await tx.execute(
        `INSERT INTO shelves(id, name, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           updated_at = excluded.updated_at`,
        [shelf.id, shelf.name, at, at],
      );
      await tx.execute('DELETE FROM shelf_books WHERE shelf_id = ?', [
        shelf.id,
      ]);
      for (const [position, bookId] of shelf.bookIds.entries()) {
        await tx.execute(
          `INSERT INTO shelf_books(shelf_id, book_id, position, added_at)
           VALUES (?, ?, ?, ?)`,
          [shelf.id, bookId, position, at],
        );
      }
    });
  }

  async removeBookmark(bookId: BookId, atSec: number): Promise<void> {
    await this.db.execute(
      'DELETE FROM bookmarks WHERE book_id = ? AND at_sec = ?',
      [bookId, Math.floor(atSec)],
    );
  }

  async addBookmark(bookId: BookId, atSec: number): Promise<void> {
    await this.db.execute(
      `INSERT INTO bookmarks(book_id, at_sec, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(book_id, at_sec) DO NOTHING`,
      [bookId, Math.floor(atSec), this.now()],
    );
  }
}
