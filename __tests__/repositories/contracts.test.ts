import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
  SocialRepository,
} from '../../app/repositories';
import type {
  BookWork,
  LibraryEntry,
  ListeningProgress,
  SocialActivity,
} from '../../app/domain';

describe('repository contracts', () => {
  it('supports catalogue lookup without exposing transport details', async () => {
    const book: BookWork = {
      id: 'book-1',
      title: 'Book One',
      authors: [{name: 'Author'}],
      subjects: [],
      identifiers: {},
    };
    const repository: CatalogueRepository = {
      get: async id => (id === book.id ? book : null),
      list: async () => [book],
    };

    expect(await repository.get('book-1')).toEqual(book);
    expect(await repository.list()).toEqual([book]);
  });

  it('supports durable library and progress operations', async () => {
    const entry: LibraryEntry = {
      bookId: 'book-1',
      status: 'listening',
      positionSec: 30,
    };
    const progress: ListeningProgress = {
      bookId: 'book-1',
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
    expect(await positions.get('book-1')).toEqual(progress);
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

    expect(await social.listFeed()).toEqual(activity ? [activity] : []);
  });
});
