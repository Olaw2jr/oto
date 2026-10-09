import type {
  CollectionsRepository,
  LibraryRepository,
  ProgressRepository,
} from '../repositories';
import type {SyncRecorder} from './SyncRecorder';

// Repositories that also record each saved change for oto-api. The local
// save comes first; a change that fails to save is never recorded.

export const syncLibrary = (
  inner: LibraryRepository,
  recorder: SyncRecorder,
): LibraryRepository => ({
  get: id => inner.get(id),
  list: () => inner.list(),
  save: async entry => {
    const before = await inner.get(entry.bookId);
    await inner.save(entry);
    // Most saves are position checkpoints; only status changes are synced here.
    if (before?.status !== entry.status) {
      await recorder.libraryStatus(entry.bookId, entry.status);
    }
  },
  remove: async id => {
    await inner.remove(id);
    await recorder.libraryStatus(id, 'removed');
  },
});

export const syncProgress = (
  inner: ProgressRepository,
  recorder: SyncRecorder,
): ProgressRepository => ({
  get: (bookId, renditionId) => inner.get(bookId, renditionId),
  save: async progress => {
    await inner.save(progress);
    await recorder.progress(progress.bookId, progress.positionSec);
  },
});

export const syncCollections = (
  inner: CollectionsRepository,
  recorder: SyncRecorder,
): CollectionsRepository => ({
  load: () => inner.load(),
  saveRating: async (bookId, stars) => {
    await inner.saveRating(bookId, stars);
    await recorder.rating(bookId, stars);
  },
  saveShelf: async shelf => {
    await inner.saveShelf(shelf);
    await recorder.shelf(shelf);
  },
  deleteShelf: async shelfId => {
    await inner.deleteShelf(shelfId);
    await recorder.shelfDeleted(shelfId);
  },
  // Bookmarks stay on the device; the protocol has no kind for them yet.
  addBookmark: (bookId, atSec) => inner.addBookmark(bookId, atSec),
  removeBookmark: (bookId, atSec) => inner.removeBookmark(bookId, atSec),
});
