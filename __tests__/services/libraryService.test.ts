import type {
  Book,
  BookId,
  LibraryEntry,
  ListeningProgress,
  LibraryStatus,
} from '../../app/domain';
import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
} from '../../app/repositories';
import {LibraryService} from '../../app/services/LibraryService';

const book: Book = {
  id: 'book-1',
  title: 'Book One',
  author: 'Author',
  narrator: 'Narrator',
  durationSec: 100,
  chapters: 5,
};

class CatalogueMemory implements CatalogueRepository {
  async get(id: BookId) {
    return id === book.id ? book : null;
  }
  async list() {
    return [book];
  }
}

class LibraryMemory implements LibraryRepository {
  entries = new Map<BookId, LibraryEntry>();

  async get(id: BookId) {
    return this.entries.get(id) ?? null;
  }
  async list() {
    return [...this.entries.values()];
  }
  async save(entry: LibraryEntry) {
    this.entries.set(entry.bookId, {...entry});
  }
  async remove(id: BookId) {
    this.entries.delete(id);
  }
}

class ProgressMemory implements ProgressRepository {
  entries = new Map<BookId, ListeningProgress>();

  async get(id: BookId) {
    return this.entries.get(id) ?? null;
  }
  async save(progress: ListeningProgress) {
    this.entries.set(progress.bookId, {...progress});
  }
}

const setup = () => {
  const catalogue = new CatalogueMemory();
  const library = new LibraryMemory();
  const progress = new ProgressMemory();
  const service = new LibraryService({catalogue, library, progress});
  return {service, library, progress};
};

describe('LibraryService', () => {
  it('starts a new positioned book as listening and persists progress', async () => {
    const {service, library, progress} = setup();

    await service.setPosition(book.id, 25);

    expect(await library.get(book.id)).toEqual({
      bookId: book.id,
      status: 'listening',
      positionSec: 25,
    });
    expect(await progress.get(book.id)).toEqual({
      bookId: book.id,
      positionSec: 25,
      durationSec: 100,
    });
  });

  it('clamps seeks and advances to the book duration', async () => {
    const {service} = setup();

    await service.setPosition(book.id, 95);
    await service.advance(book.id, 20);

    expect(await service.getPosition(book.id)).toBe(100);

    await service.advance(book.id, -150);
    expect(await service.getPosition(book.id)).toBe(0);
  });

  it('finishing a book moves progress to the end', async () => {
    const {service} = setup();

    await service.setPosition(book.id, 40);
    await service.setStatus(book.id, 'finished');

    expect(await service.getStatus(book.id)).toBe('finished');
    expect(await service.getPosition(book.id)).toBe(100);
    expect(await service.getProgress(book.id)).toBe(1);
  });

  it('preserves position when changing between non-finished statuses', async () => {
    const {service} = setup();

    await service.setPosition(book.id, 40);
    await service.setStatus(book.id, 'want');

    expect(await service.getStatus(book.id)).toBe('want');
    expect(await service.getPosition(book.id)).toBe(40);
  });

  it('lists books by status through the repository boundary', async () => {
    const {service} = setup();
    const statuses: LibraryStatus[] = ['want', 'listening', 'finished'];

    for (const status of statuses) {
      await service.setStatus(book.id, status);
      expect(await service.listByStatus(status)).toEqual([book.id]);
    }
  });

  it('rejects unknown catalogue ids instead of persisting orphan state', async () => {
    const {service} = setup();

    await expect(service.setPosition('missing', 10)).rejects.toThrow(
      'Unknown book: missing',
    );
  });
});
