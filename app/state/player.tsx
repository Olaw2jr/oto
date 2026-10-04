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

export type SleepTimer =
  | {kind: 'minutes'; minutes: number}
  | {kind: 'chapter'}
  | null;

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
  // Pauses playback after some minutes or at the end of the chapter.
  sleepTimer: SleepTimer;
  setSleepTimer: (timer: SleepTimer) => void;
};

const PlayerContext = createContext<PlayerValue | null>(null);

// A mock player: there is no audio yet, so the clock just advances while
// "playing" and writes the position back to the library.
export const PlayerProvider = ({children}: {children: ReactNode}) => {
  const library = useLibrary();
  const [bookId, setBookId] = useState(CURRENT_BOOK);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [sleepTimer, setSleepTimerState] = useState<SleepTimer>(null);
  // Where the current chapter ends when the timer is "end of chapter".
  const [chapterEnd, setChapterEnd] = useState<number | null>(null);
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
    const timer = setInterval(
      () => advance(bookId, rate, chapterEnd ?? undefined),
      1000,
    );
    return () => clearInterval(timer);
  }, [playing, rate, bookId, advance, chapterEnd]);

  const setSleepTimer = useCallback(
    (timer: SleepTimer) => {
      setSleepTimerState(timer);
      if (timer?.kind === 'chapter') {
        const chapterLength = book.durationSec / book.chapters;
        setChapterEnd(
          Math.min(
            book.durationSec,
            (Math.floor(position / chapterLength) + 1) * chapterLength,
          ),
        );
      } else {
        setChapterEnd(null);
      }
    },
    [book.durationSec, book.chapters, position],
  );

  // Minutes: pause when the time is up.
  useEffect(() => {
    if (sleepTimer?.kind !== 'minutes') {
      return;
    }
    const timer = setTimeout(() => {
      setPlaying(false);
      setSleepTimerState(null);
    }, sleepTimer.minutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [sleepTimer]);

  // End of chapter: pause once playback reaches it.
  useEffect(() => {
    if (
      sleepTimer?.kind === 'chapter' &&
      chapterEnd !== null &&
      position >= chapterEnd
    ) {
      setPlaying(false);
      setSleepTimerState(null);
      setChapterEnd(null);
    }
  }, [sleepTimer, chapterEnd, position]);

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
      sleepTimer,
      setSleepTimer,
    }),
    [
      book,
      bookId,
      position,
      playing,
      rate,
      play,
      seekTo,
      advance,
      sleepTimer,
      setSleepTimer,
    ],
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
