import type {
  AudioRendition,
  BookWork,
  ListeningProgress,
} from '../../app/domain';
import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
  RenditionRepository,
} from '../../app/repositories';
import {LibraryService} from '../../app/services/LibraryService';

const work: BookWork = {
  id: 'book-1',
  title: 'Book One',
  authors: [{name: 'Author'}],
  subjects: [],
  identifiers: {},
};

const rendition: AudioRendition = {
  id: 'rendition-1',
  workId: work.id,
  narrators: [{name: 'Narrator'}],
  language: 'en',
  durationSec: 100,
  chapters: [{id: 'chapter-1', title: 'Chapter 1', startSec: 0, durationSec: 100}],
  rights: {
    status: 'public-domain',
    source: 'test',
    verifiedAt: '2026-10-05T00:00:00Z',
  },
};

describe('rendition-aware listening progress', () => {
  it('clamps and persists progress against the selected audio rendition', async () => {
    const catalogue: CatalogueRepository = {
      get: async id => (id === work.id ? work : null),
      list: async () => [work],
    };
    const renditions: RenditionRepository = {
      get: async id => (id === rendition.id ? rendition : null),
      listForWork: async bookId => (bookId === work.id ? [rendition] : []),
    };
    const libraryEntries = new Map<string, any>();
    const progressEntries = new Map<string, ListeningProgress>();
    const library: LibraryRepository = {
      get: async id => libraryEntries.get(id) ?? null,
      list: async () => [...libraryEntries.values()],
      save: async entry => {
        libraryEntries.set(entry.bookId, entry);
      },
      remove: async id => {
        libraryEntries.delete(id);
      },
    };
    const progress: ProgressRepository = {
      get: async (bookId, renditionId) =>
        progressEntries.get(`${bookId}:${renditionId}`) ?? null,
      save: async value => {
        progressEntries.set(`${value.bookId}:${value.renditionId}`, value);
      },
    };
    const service = new LibraryService({
      catalogue,
      renditions,
      library,
      progress,
    });

    await service.setPosition(work.id, rendition.id, 150, 'chapter-1');

    expect(await service.getPosition(work.id, rendition.id)).toBe(100);
    expect(await progress.get(work.id, rendition.id)).toEqual({
      bookId: work.id,
      renditionId: rendition.id,
      chapterId: 'chapter-1',
      positionSec: 100,
      durationSec: 100,
    });
  });

  it('rejects a rendition that belongs to another work', async () => {
    const catalogue: CatalogueRepository = {
      get: async () => work,
      list: async () => [work],
    };
    const wrong = {...rendition, workId: 'other-book'};
    const renditions: RenditionRepository = {
      get: async () => wrong,
      listForWork: async () => [wrong],
    };
    const library: LibraryRepository = {
      get: async () => null,
      list: async () => [],
      save: async () => {},
      remove: async () => {},
    };
    const progress: ProgressRepository = {
      get: async () => null,
      save: async () => {},
    };
    const service = new LibraryService({
      catalogue,
      renditions,
      library,
      progress,
    });

    await expect(
      service.setPosition(work.id, rendition.id, 20),
    ).rejects.toThrow('does not belong to book');
  });
});
