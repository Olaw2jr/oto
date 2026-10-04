import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {CatalogueBook, getBook} from '../data/catalogue';
import {CURRENT_BOOK} from '../data/social';
import {useLibrary} from './library';

export const RATES = [1, 1.25, 1.5, 2, 0.75];

type PlayerValue = {
  book: CatalogueBook;
  position: number;
  playing: boolean;
  rate: number;
  play: (bookId: string) => void;
  toggle: () => void;
  skip: (seconds: number) => void;
  seekTo: (seconds: number) => void;
  cycleRate: () => void;
};

const PlayerContext = createContext<PlayerValue | null>(null);

// A mock player: there is no audio yet, so the clock just advances while
// "playing" and writes the position back to the library.
export const PlayerProvider = ({children}: {children: ReactNode}) => {
  const library = useLibrary();
  const [bookId, setBookId] = useState(CURRENT_BOOK);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const book = getBook(bookId);
  const position = library.positionSec(bookId);

  const {setPosition, advance} = library;

  const seekTo = useCallback(
    (seconds: number) =>
      setPosition(bookId, Math.min(book.durationSec, Math.max(0, seconds))),
    [setPosition, bookId, book.durationSec],
  );

  useEffect(() => {
    if (!playing) {
      return;
    }
    const timer = setInterval(() => advance(bookId, rate), 1000);
    return () => clearInterval(timer);
  }, [playing, rate, bookId, advance]);

  const play = useCallback(
    (id: string) => {
      if (library.status(id) !== 'listening') {
        library.setStatus(id, 'listening');
      }
      setBookId(id);
      setPlaying(true);
    },
    [library],
  );

  const value = useMemo<PlayerValue>(
    () => ({
      book,
      position,
      playing,
      rate,
      play,
      toggle: () => setPlaying(p => !p),
      skip: seconds => advance(bookId, seconds),
      seekTo,
      cycleRate: () =>
        setRate(r => RATES[(RATES.indexOf(r) + 1) % RATES.length]),
    }),
    [book, bookId, position, playing, rate, play, seekTo, advance],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const value = useContext(PlayerContext);
  if (!value) {
    throw new Error('usePlayer must be used inside a PlayerProvider');
  }
  return value;
};
