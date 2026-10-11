import type {CollectionsRepository, LibraryRepository, ProgressRepository} from '../../app/repositories';
import {
  syncCollections,
  syncLibrary,
  syncProgress,
} from '../../app/sync/SyncingRepositories';
import type {SyncRecorder} from '../../app/sync/SyncRecorder';
import type {LibraryEntry} from '../../app/domain/library';

const SHELF = '0b5e3e0e-3d1f-4c33-9a43-7f8a2b6c1d22';

function recorder() {
  const calls: unknown[][] = [];
  const record = (name: string) => async (...args: unknown[]) => {
    calls.push([name, ...args]);
  };
  const fake = {
    libraryStatus: record('libraryStatus'),
    progress: record('progress'),
    shelf: record('shelf'),
    shelfDeleted: record('shelfDeleted'),
    rating: record('rating'),
  } as unknown as SyncRecorder;
  return {fake, calls};
}

describe('syncing repositories', () => {
  it('records library status changes, not position checkpoints', async () => {
    const stored = new Map<string, LibraryEntry>();
    const inner: LibraryRepository = {
      get: async id => stored.get(id) ?? null,
      list: async () => [...stored.values()],
      save: async entry => void stored.set(entry.bookId, entry),
      remove: async id => void stored.delete(id),
    };
    const {fake, calls} = recorder();
    const library = syncLibrary(inner, fake);

    await library.save({bookId: 'greenlights', status: 'listening', positionSec: 0});
    await library.save({bookId: 'greenlights', status: 'listening', positionSec: 60});
    await library.save({bookId: 'greenlights', status: 'finished', positionSec: 900});
    await library.remove('greenlights');

    expect(stored.size).toBe(0);
    expect(calls).toEqual([
      ['libraryStatus', 'greenlights', 'listening'],
      ['libraryStatus', 'greenlights', 'finished'],
      ['libraryStatus', 'greenlights', 'removed'],
    ]);
  });

  it('records every saved position for the recorder to throttle', async () => {
    const saved: unknown[] = [];
    const inner: ProgressRepository = {
      get: async () => null,
      save: async p => void saved.push(p),
    };
    const {fake, calls} = recorder();
    const entry = {bookId: 'greenlights', renditionId: 'r', positionSec: 42.5, durationSec: 900};

    await syncProgress(inner, fake).save(entry);

    expect(saved).toEqual([entry]);
    expect(calls).toEqual([['progress', 'greenlights', 42.5]]);
  });

  it('records shelves and ratings, but not bookmarks', async () => {
    const inner: CollectionsRepository = {
      load: async () => ({ratings: {}, shelves: [], bookmarks: {}}),
      saveRating: async () => {},
      saveShelf: async () => {},
      deleteShelf: async () => {},
      addBookmark: async () => {},
      removeBookmark: async () => {},
    };
    const {fake, calls} = recorder();
    const collections = syncCollections(inner, fake);
    const shelf = {id: SHELF, name: 'Road trips', bookIds: []};

    await collections.saveShelf(shelf);
    await collections.deleteShelf(SHELF);
    await collections.saveRating('greenlights', 5);
    await collections.addBookmark('greenlights', 30);

    expect(calls).toEqual([
      ['shelf', shelf],
      ['shelfDeleted', SHELF],
      ['rating', 'greenlights', 5],
    ]);
  });

  it("doesn't record a change that failed to save", async () => {
    const inner = {
      saveRating: async () => {
        throw new Error('disk full');
      },
    } as unknown as CollectionsRepository;
    const {fake, calls} = recorder();

    await expect(syncCollections(inner, fake).saveRating('greenlights', 3)).rejects.toThrow('disk full');
    expect(calls).toEqual([]);
  });
});
