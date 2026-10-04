import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {getBook} from '../data/catalogue';
import {CustomShelf, librarySeed, shelvesSeed, Status} from '../data/social';

type Entry = {status: Status; positionSec: number};

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

const seed = (): Record<string, Entry> =>
  Object.fromEntries(
    Object.entries(librarySeed).map(([id, {status, position = 0}]) => [
      id,
      {status, positionSec: position * getBook(id).durationSec},
    ]),
  );

export const LibraryProvider = ({children}: {children: ReactNode}) => {
  const [entries, setEntries] = useState<Record<string, Entry>>(seed);
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

  const setStatus = useCallback((bookId: string, status: Status) => {
    setEntries(current => ({
      ...current,
      [bookId]: {
        status,
        positionSec:
          status === 'finished'
            ? getBook(bookId).durationSec
            : current[bookId]?.positionSec ?? 0,
      },
    }));
  }, []);

  const setPosition = useCallback((bookId: string, positionSec: number) => {
    setEntries(current => ({
      ...current,
      [bookId]: {
        status: current[bookId]?.status ?? 'listening',
        positionSec,
      },
    }));
  }, []);

  const advance = useCallback(
    (bookId: string, deltaSec: number, limitSec?: number) => {
      const durationSec = Math.min(
        getBook(bookId).durationSec,
        limitSec ?? Infinity,
      );
      setEntries(current => {
        const entry = current[bookId] ?? {status: 'listening', positionSec: 0};
        const positionSec = Math.min(
          durationSec,
          Math.max(0, entry.positionSec + deltaSec),
        );
        return {...current, [bookId]: {...entry, positionSec}};
      });
    },
    [],
  );

  const value = useMemo<LibraryValue>(() => {
    const byStatus = (status: Status) =>
      Object.keys(entries).filter(id => entries[id].status === status);
    const shelves: Shelf[] = [
      {
        id: 'want',
        name: 'Want to listen',
        bookIds: byStatus('want'),
        custom: false,
      },
      {
        id: 'finished',
        name: 'Finished',
        bookIds: byStatus('finished'),
        custom: false,
      },
      ...custom.map(s => ({...s, custom: true})),
    ];
    return {
      status: id => entries[id]?.status,
      positionSec: id => entries[id]?.positionSec ?? 0,
      progress: id =>
        Math.min(1, (entries[id]?.positionSec ?? 0) / getBook(id).durationSec),
      byStatus,
      setStatus,
      setPosition,
      advance,
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
    entries,
    ratings,
    custom,
    setStatus,
    setPosition,
    advance,
    setRating,
    createShelf,
    toggleOnShelf,
    marks,
    addBookmark,
  ]);

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
