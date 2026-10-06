import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  createSeedLibraryProviderAdapter,
  type LibraryProviderAdapter,
} from '../adapters/library';
import {CustomShelf, shelvesSeed, Status} from '../data/social';

export type Shelf = CustomShelf & {custom: boolean};

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
};

const LibraryContext = createContext<LibraryValue | null>(null);

export const LibraryProvider = ({
  children,
  adapter: providedAdapter,
}: {
  children: ReactNode;
  adapter?: LibraryProviderAdapter;
}) => {
  const [adapter] = useState(
    () => providedAdapter ?? createSeedLibraryProviderAdapter(),
  );
  const revision = useSyncExternalStore(
    adapter.subscribe,
    adapter.getSnapshot,
    adapter.getSnapshot,
  );
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [custom, setCustom] = useState<CustomShelf[]>(shelvesSeed);
  const [marks, setMarks] = useState<Record<string, number[]>>({});

  const addBookmark = useCallback((bookId: string, at: number) => {
    const second = Math.floor(at);
    setMarks(current => {
      const list = current[bookId] ?? [];
      return list.includes(second)
        ? current
        : {...current, [bookId]: [...list, second].sort((a, b) => a - b)};
    });
  }, []);

  const createShelf = useCallback(
    (name: string, bookId?: string) => {
      const base =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'shelf';
      const taken = new Set(custom.map(s => s.id).concat(['want', 'finished']));
      let id = base;
      for (let n = 2; taken.has(id); n++) {
        id = `${base}-${n}`;
      }
      setCustom(current => [
        ...current,
        {id, name: name.trim(), bookIds: bookId ? [bookId] : []},
      ]);
      return id;
    },
    [custom],
  );

  const toggleOnShelf = useCallback((shelfId: string, bookId: string) => {
    setCustom(current =>
      current.map(s =>
        s.id !== shelfId
          ? s
          : {
              ...s,
              bookIds: s.bookIds.includes(bookId)
                ? s.bookIds.filter(b => b !== bookId)
                : [...s.bookIds, bookId],
            },
      ),
    );
  }, []);

  const setRating = useCallback((bookId: string, stars: number | undefined) => {
    setRatings(current => {
      const next = {...current};
      if (stars === undefined) {
        delete next[bookId];
      } else {
        next[bookId] = stars;
      }
      return next;
    });
  }, []);

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
