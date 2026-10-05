import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
  RenditionRepository,
  SocialRepository,
} from '../../app/repositories';
import type {
  AudioRendition,
  BookWork,
  LibraryEntry,
  ListeningProgress,
  SocialActivity,
} from '../../app/domain';

describe('repository contracts', () => {
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
    durationSec: 3600,
    chapters: [],
    rights: {
      status: 'public-domain',
      source: 'test',
      verifiedAt: '2026-10-05T00:00:00Z',
    },
  };

  it('supports catalogue and rendition lookup without transport details', async () => {
    const catalogue: CatalogueRepository = {
      get: async id => (id === book.id ? book : null),
      list: async () => [book],
    };
    const renditions: RenditionRepository = {
      get: async id => (id === rendition.id ? rendition : null),
      listForWork: async workId => (workId === book.id ? [rendition] : []),
    };

    expect(await catalogue.get('book-1')).toEqual(book);
    expect(await renditions.get('rendition-1')).toEqual(rendition);
  });

  it('supports durable library and rendition-aware progress operations', async () => {
    const entry: LibraryEntry = {
      bookId: 'book-1',
      status: 'listening',
      positionSec: 30,
    };
    const progress: ListeningProgress = {
      bookId: 'book-1',
      renditionId: 'rendition-1',
      chapterId: 'chapter-1',
      positionSec: 30,
      durationSec: 3600,
    };

    const library: LibraryRepository = {
      get: async () => entry,
      list: async () => [entry],
      save: async () => {},
      remove: async () => {},
    };
    const positions: ProgressRepository = {
      get: async () => progress,
      save: async () => {},
    };

    expect(await library.get('book-1')).toEqual(entry);
    expect(await positions.get('book-1', 'rendition-1')).toEqual(progress);
  });

  it('keeps social persistence behind its own repository', async () => {
    const activity: SocialActivity = {
      id: 'activity-1',
      bookId: 'book-1',
      actorId: 'person-1',
      kind: 'listening',
      body: 'Started listening',
      createdAt: '2026-10-05T00:00:00Z',
    };
    const social: SocialRepository = {
      listFeed: async () => [activity],
      saveActivity: async () => {},
    };

    expect(await social.listFeed()).toEqual([activity]);
  });
});
