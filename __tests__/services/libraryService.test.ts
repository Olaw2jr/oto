import type {
  AudioRendition,
  BookId,
  BookWork,
  LibraryEntry,
  ListeningProgress,
  LibraryStatus,
  RenditionId,
} from '../../app/domain';
import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
  RenditionRepository,
} from '../../app/repositories';
import {LibraryService} from '../../app/services/LibraryService';

const book: BookWork = {
  id: 'book-1',
  title: 'Book One',
  authors: [{name: 'Author'}],
  subjects: [],
  identifiers: {},
};
const rendition: AudioRendition = {
  id: 'rendition-1',
  workId: book.id,
  narrators: [{name: 'Narrator'}],
  language: 'en',
  durationSec: 100,
  chapters: [],
  rights: {
    status: 'public-domain',
    source: 'test',
    verifiedAt: '2026-10-05T00:00:00Z',
  },
};

class CatalogueMemory implements CatalogueRepository {
  async get(id: BookId) {
    return id === book.id ? book : null;
  }
  async list() {
    return [book];
  }
}

class RenditionMemory implements RenditionRepository {
  async get(id: RenditionId) {
    return id === rendition.id ? rendition : null;
  }
  async listForWork(workId: BookId) {
    return workId === book.id ? [rendition] : [];
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
  entries = new Map<string, ListeningProgress>();

  async get(bookId: BookId, renditionId: RenditionId) {
    return this.entries.get(`${bookId}:${renditionId}`) ?? null;
  }
  async save(progress: ListeningProgress) {
    this.entries.set(
      `${progress.bookId}:${progress.renditionId}`,
      {...progress},
    );
  }
}

const setup = () => {
  const catalogue = new CatalogueMemory();
  const renditions = new RenditionMemory();
  const library = new LibraryMemory();
  const progress = new ProgressMemory();
  const service = new LibraryService({
    catalogue,
    renditions,
    library,
    progress,
  });
  return {service, library, progress};
};

describe('LibraryService', () => {
  it('starts a new positioned rendition as listening and persists progress', async () => {
    const {service, library, progress} = setup();

    await service.setPosition(book.id, rendition.id, 25, 'chapter-1');

    expect(await library.get(book.id)).toEqual({
      bookId: book.id,
      status: 'listening',
      positionSec: 25,
    });
    expect(await progress.get(book.id, rendition.id)).toEqual({
      bookId: book.id,
      renditionId: rendition.id,
      chapterId: 'chapter-1',
      positionSec: 25,
      durationSec: 100,
    });
  });

  it('moves a wanted book to listening when playback position is saved', async () => {
    const {service, library} = setup();
    await service.setStatus(book.id, rendition.id, 'want');

    await service.setPosition(book.id, rendition.id, 25);

    expect(await library.get(book.id)).toEqual({
      bookId: book.id,
      status: 'listening',
      positionSec: 25,
    });
  });

  it('clamps seeks and advances to the rendition duration', async () => {
    const {service} = setup();

    await service.setPosition(book.id, rendition.id, 95);
    await service.advance(book.id, rendition.id, 20);

    expect(await service.getPosition(book.id, rendition.id)).toBe(100);

    await service.advance(book.id, rendition.id, -150);
    expect(await service.getPosition(book.id, rendition.id)).toBe(0);
  });

  it('finishing a book moves the selected rendition to the end', async () => {
    const {service} = setup();

    await service.setPosition(book.id, rendition.id, 40);
    await service.setStatus(book.id, rendition.id, 'finished');

    expect(await service.getStatus(book.id)).toBe('finished');
    expect(await service.getPosition(book.id, rendition.id)).toBe(100);
    expect(await service.getProgress(book.id, rendition.id)).toBe(1);
  });

  it('preserves position when changing between non-finished statuses', async () => {
    const {service} = setup();

    await service.setPosition(book.id, rendition.id, 40);
    await service.setStatus(book.id, rendition.id, 'want');

    expect(await service.getStatus(book.id)).toBe('want');
    expect(await service.getPosition(book.id, rendition.id)).toBe(40);
  });

  it('lists books by status through the repository boundary', async () => {
    const {service} = setup();
    const statuses: LibraryStatus[] = ['want', 'listening', 'finished'];

    for (const status of statuses) {
      await service.setStatus(book.id, rendition.id, status);
      expect(await service.listByStatus(status)).toEqual([book.id]);
    }
  });

  it('rejects unknown catalogue ids instead of persisting orphan state', async () => {
    const {service} = setup();

    await expect(
      service.setPosition('missing', rendition.id, 10),
    ).rejects.toThrow('Unknown book: missing');
  });
});
