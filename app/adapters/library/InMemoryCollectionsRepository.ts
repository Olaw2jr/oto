import type {
  BookId,
  PersonalCollections,
  ShelfRecord,
} from '../../domain';
import type {CollectionsRepository} from '../../repositories';

const copy = (c: PersonalCollections): PersonalCollections => ({
  ratings: {...c.ratings},
  shelves: c.shelves.map(s => ({...s, bookIds: [...s.bookIds]})),
  bookmarks: Object.fromEntries(
    Object.entries(c.bookmarks).map(([id, marks]) => [id, [...marks]]),
  ),
});

// Collections kept in memory, for the demo library and tests.
export class InMemoryCollectionsRepository implements CollectionsRepository {
  private state: PersonalCollections;

  constructor(
    initial: PersonalCollections = {ratings: {}, shelves: [], bookmarks: {}},
  ) {
    this.state = copy(initial);
  }

  snapshot(): PersonalCollections {
    return copy(this.state);
  }

  async load(): Promise<PersonalCollections> {
    return this.snapshot();
  }

  async saveRating(bookId: BookId, stars: number | null): Promise<void> {
    const ratings = {...this.state.ratings};
    if (stars === null) {
      delete ratings[bookId];
    } else {
      ratings[bookId] = stars;
    }
    this.state = {...this.state, ratings};
  }

  async saveShelf(shelf: ShelfRecord): Promise<void> {
    const saved = {...shelf, bookIds: [...shelf.bookIds]};
    const exists = this.state.shelves.some(s => s.id === shelf.id);
    this.state = {
      ...this.state,
      shelves: exists
        ? this.state.shelves.map(s => (s.id === shelf.id ? saved : s))
        : [...this.state.shelves, saved],
    };
  }

  async addBookmark(bookId: BookId, atSec: number): Promise<void> {
    const second = Math.floor(atSec);
    const list = this.state.bookmarks[bookId] ?? [];
    if (list.includes(second)) {
      return;
    }
    this.state = {
      ...this.state,
      bookmarks: {
        ...this.state.bookmarks,
        [bookId]: [...list, second].sort((a, b) => a - b),
      },
    };
  }
}
