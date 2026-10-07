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
import type {
  PlayerController,
  PlayerSleepTimer,
} from '../player';
import {useLibrary} from './library';

export const RATES = [1, 1.25, 1.5, 2, 0.75];

export type SleepTimer = PlayerSleepTimer;

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
  sleepTimer: SleepTimer;
  setSleepTimer: (timer: SleepTimer) => void;
};

const PlayerContext = createContext<PlayerValue | null>(null);

const EnginePlayerProvider = ({
  children,
  controller,
}: {
  children: ReactNode;
  controller: PlayerController;
}) => {
  const library = useLibrary();
  const [snapshot, setSnapshot] = useState(() => controller.getSnapshot());

  useEffect(
    () => controller.subscribe(next => setSnapshot(next)),
    [controller],
  );

  const bookId = snapshot.bookId ?? CURRENT_BOOK;
  const book = getBook(bookId);
  const position = snapshot.positionSec;
  const playing = snapshot.state === 'playing';
  const rate = snapshot.rate;

  const run = useCallback((operation: () => Promise<void>) => {
    void operation().catch(() => {});
  }, []);

  const play = useCallback(
    (id: string) => {
      if (id !== bookId) {
        return;
      }
      if (library.status(id) !== 'listening') {
        library.setStatus(id, 'listening');
      }
      run(() => controller.play());
    },
    [bookId, controller, library, run],
  );

  const toggle = useCallback(
    () => run(() => controller.toggle()),
    [controller, run],
  );

  const skip = useCallback(
    (seconds: number) => run(() => controller.skipBy(seconds)),
    [controller, run],
  );

  const seekTo = useCallback(
    (seconds: number) => run(() => controller.seekTo(seconds)),
    [controller, run],
  );

  const cycleRate = useCallback(() => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    run(() => controller.setRate(next));
  }, [controller, rate, run]);

  const setSleepTimer = useCallback(
    (timer: SleepTimer) => run(() => controller.setSleepTimer(timer)),
    [controller, run],
  );

  const value = useMemo<PlayerValue>(
    () => ({
      book,
      position,
      playing,
      rate,
      play,
      toggle,
      skip,
      seekTo,
      cycleRate,
      sleepTimer: snapshot.sleepTimer,
      setSleepTimer,
    }),
    [
      book,
      position,
      playing,
      rate,
      play,
      toggle,
      skip,
      seekTo,
      cycleRate,
      snapshot.sleepTimer,
      setSleepTimer,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};

// Temporary compatibility path. P82-08 removes this once all production
// composition, source resolution and sleep-timer slices are in place.
const MockPlayerProvider = ({children}: {children: ReactNode}) => {
  const library = useLibrary();
  const [bookId, setBookId] = useState(CURRENT_BOOK);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [sleepTimer, setSleepTimerState] = useState<SleepTimer>(null);
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

export const PlayerProvider = ({
  children,
  controller,
}: {
  children: ReactNode;
  controller?: PlayerController;
}) =>
  controller ? (
    <EnginePlayerProvider controller={controller}>
      {children}
    </EnginePlayerProvider>
  ) : (
    <MockPlayerProvider>{children}</MockPlayerProvider>
  );

export const usePlayer = () => {
  const value = useContext(PlayerContext);
  if (!value) {
    throw new Error('usePlayer must be used inside a PlayerProvider');
  }
  return value;
};
