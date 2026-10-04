import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {getBook} from '../data/catalogue';
import {librarySeed, Status} from '../data/social';

type Entry = {status: Status; positionSec: number};

type LibraryValue = {
  status: (bookId: string) => Status | undefined;
  // 0–1 through the book.
  progress: (bookId: string) => number;
  positionSec: (bookId: string) => number;
  byStatus: (status: Status) => string[];
  setStatus: (bookId: string, status: Status) => void;
  setPosition: (bookId: string, positionSec: number) => void;
  // Moves the position by a delta, clamped to the book's length.
  advance: (bookId: string, deltaSec: number) => void;
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

  const advance = useCallback((bookId: string, deltaSec: number) => {
    const {durationSec} = getBook(bookId);
    setEntries(current => {
      const entry = current[bookId] ?? {status: 'listening', positionSec: 0};
      const positionSec = Math.min(
        durationSec,
        Math.max(0, entry.positionSec + deltaSec),
      );
      return {...current, [bookId]: {...entry, positionSec}};
    });
  }, []);

  const value = useMemo<LibraryValue>(
    () => ({
      status: id => entries[id]?.status,
      positionSec: id => entries[id]?.positionSec ?? 0,
      progress: id =>
        Math.min(1, (entries[id]?.positionSec ?? 0) / getBook(id).durationSec),
      byStatus: status =>
        Object.keys(entries).filter(id => entries[id].status === status),
      setStatus,
      setPosition,
      advance,
    }),
    [entries, setStatus, setPosition, advance],
  );

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
