import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  createSeedLibraryProviderAdapter,
  InMemoryCollectionsRepository,
  type LibraryProviderAdapter,
} from '../adapters/library';
import type {PersonalCollections, ShelfRecord} from '../domain';
import type {CollectionsRepository} from '../repositories';
import {shelvesSeed, Status} from '../data/social';

export type Shelf = ShelfRecord & {custom: boolean};

// Where ratings, your shelves and bookmarks are kept, and what they held
// when the app opened.
export type LibraryCollections = {
  repository: CollectionsRepository;
  initial: PersonalCollections;
};

const createSeedCollections = (): LibraryCollections => {
  const repository = new InMemoryCollectionsRepository({
    ratings: {},
    shelves: shelvesSeed,
    bookmarks: {},
  });
  return {repository, initial: repository.snapshot()};
};

// Saving happens in the background; the screen already shows the change.
const persist = (write: Promise<void>) => {
  write.catch(error => console.warn('Could not save to your library', error));
};

type LibraryValue = {
  status: (bookId: string) => Status | undefined;
  // 0–1 through the book.
  progress: (bookId: string) => number;
  positionSec: (bookId: string) => number;
  byStatus: (status: Status) => string[];
  setStatus: (bookId: string, status: Status) => void;
  setPosition: (bookId: string, positionSec: number) => void;
  // Moves the position by a delta, clamped to the book's length.
  // An optional limit stops it early, e.g. at the end of a chapter.
  advance: (bookId: string, deltaSec: number, limitSec?: number) => void;
  // Your own 1–5 star rating.
  rating: (bookId: string) => number | undefined;
  setRating: (bookId: string, stars: number | undefined) => void;
  // Want to listen and Finished, then your own shelves.
  shelves: Shelf[];
  shelf: (id: string) => Shelf | undefined;
  createShelf: (name: string, bookId?: string) => string;
  toggleOnShelf: (shelfId: string, bookId: string) => void;
  // Moments you bookmarked in each book, in seconds, earliest first.
  bookmarks: (bookId: string) => number[];
  addBookmark: (bookId: string, at: number) => void;
  removeBookmark: (bookId: string, at: number) => void;
};

const LibraryContext = createContext<LibraryValue | null>(null);

export const LibraryProvider = ({
  children,
  adapter: providedAdapter,
  collections: providedCollections,
}: {
  children: ReactNode;
  adapter?: LibraryProviderAdapter;
  collections?: LibraryCollections;
}) => {
  const [adapter] = useState(
    () => providedAdapter ?? createSeedLibraryProviderAdapter(),
  );
  const revision = useSyncExternalStore(
    adapter.subscribe,
    adapter.getSnapshot,
    adapter.getSnapshot,
  );
  const [{repository, initial}] = useState(
    () => providedCollections ?? createSeedCollections(),
  );
  const [ratings, setRatings] = useState<Record<string, number>>(
    initial.ratings,
  );
  const [custom, setCustom] = useState<ShelfRecord[]>(initial.shelves);
  const [marks, setMarks] = useState<Record<string, number[]>>(
    initial.bookmarks,
  );
  // The latest shelves, so a change can be saved as well as shown.
  const customRef = useRef(custom);

  const saveShelves = useCallback(
    (next: ShelfRecord[], changed: ShelfRecord) => {
      customRef.current = next;
      setCustom(next);
      persist(repository.saveShelf(changed));
    },
    [repository],
  );

  const addBookmark = useCallback(
    (bookId: string, at: number) => {
      const second = Math.floor(at);
      setMarks(current => {
        const list = current[bookId] ?? [];
        return list.includes(second)
          ? current
          : {...current, [bookId]: [...list, second].sort((a, b) => a - b)};
      });
      persist(repository.addBookmark(bookId, second));
    },
    [repository],
  );

  const removeBookmark = useCallback(
    (bookId: string, at: number) => {
      const second = Math.floor(at);
      setMarks(current => {
        const list = (current[bookId] ?? []).filter(m => m !== second);
        const next = {...current};
        if (list.length) {
          next[bookId] = list;
        } else {
          delete next[bookId];
        }
        return next;
      });
      persist(repository.removeBookmark(bookId, second));
    },
    [repository],
  );

  const createShelf = useCallback(
    (name: string, bookId?: string) => {
      const current = customRef.current;
      const base =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'shelf';
      const taken = new Set(
        current.map(s => s.id).concat(['want', 'finished']),
      );
      let id = base;
      for (let n = 2; taken.has(id); n++) {
        id = `${base}-${n}`;
      }
      const shelf = {id, name: name.trim(), bookIds: bookId ? [bookId] : []};
      saveShelves([...current, shelf], shelf);
      return id;
    },
    [saveShelves],
  );

  const toggleOnShelf = useCallback(
    (shelfId: string, bookId: string) => {
      const current = customRef.current;
      const shelf = current.find(s => s.id === shelfId);
      if (!shelf) {
        return;
      }
      const changed = {
        ...shelf,
        bookIds: shelf.bookIds.includes(bookId)
          ? shelf.bookIds.filter(b => b !== bookId)
          : [...shelf.bookIds, bookId],
      };
      saveShelves(
        current.map(s => (s.id === shelfId ? changed : s)),
        changed,
      );
    },
    [saveShelves],
  );

  const setRating = useCallback(
    (bookId: string, stars: number | undefined) => {
      setRatings(current => {
        const next = {...current};
        if (stars === undefined) {
          delete next[bookId];
        } else {
          next[bookId] = stars;
        }
        return next;
      });
      persist(repository.saveRating(bookId, stars ?? null));
    },
    [repository],
  );

  // The external-store revision is an invalidation signal for adapter-derived shelves.
  /* eslint-disable react-hooks/exhaustive-deps */
  const value = useMemo<LibraryValue>(() => {
    const shelves: Shelf[] = [
      {
        id: 'want',
        name: 'Want to listen',
        bookIds: adapter.byStatus('want'),
        custom: false,
      },
      {
        id: 'finished',
        name: 'Finished',
        bookIds: adapter.byStatus('finished'),
        custom: false,
      },
      ...custom.map(s => ({...s, custom: true})),
    ];

    return {
      status: adapter.status,
      positionSec: adapter.positionSec,
      progress: adapter.progress,
      byStatus: adapter.byStatus,
      setStatus: adapter.setStatus,
      setPosition: adapter.setPosition,
      advance: adapter.advance,
      rating: id => ratings[id],
      setRating,
      shelves,
      shelf: id => shelves.find(s => s.id === id),
      createShelf,
      toggleOnShelf,
      bookmarks: id => marks[id] ?? [],
      addBookmark,
      removeBookmark,
    };
  }, [
    adapter,
    ratings,
    custom,
    setRating,
    createShelf,
    toggleOnShelf,
    marks,
    addBookmark,
    removeBookmark,
    revision,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const value = useContext(LibraryContext);
  if (!value) {
    throw new Error('useLibrary must be used inside a LibraryProvider');
  }
  return value;
};
