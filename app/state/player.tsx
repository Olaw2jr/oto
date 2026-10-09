import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {CatalogueBook, getBook} from '../data/catalogue';
import {CURRENT_BOOK} from '../data/social';
import {PlaybackUnavailableError} from '../player/PlaybackQueueResolver';
import type {
  PlayerController,
  PlayerControllerSnapshot,
  PlayerSleepTimer,
} from '../player';
import {useLibrary} from './library';
import {SPEED_OPTIONS, useSettings} from './settings';

export const RATES = SPEED_OPTIONS;

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
  // Why the last player action failed, in words for the listener.
  error: string | null;
  dismissError: () => void;
};

export const UNAVAILABLE_MESSAGE =
  "This book isn't available to listen to yet.";
export const FAILED_MESSAGE =
  "Couldn't start playback. Check your connection and try again.";

const PlayerContext = createContext<PlayerValue | null>(null);

const EMPTY_SNAPSHOT: PlayerControllerSnapshot = {
  state: 'idle',
  positionSec: 0,
  durationSec: 0,
  rate: 1,
  sleepTimer: null,
};

export const PlayerProvider = ({
  children,
  controller: providedController,
  createController,
}: {
  children: ReactNode;
  controller?: PlayerController;
  createController?: () => Promise<PlayerController>;
}) => {
  const library = useLibrary();
  const {skip: skipIntervals, speed, set: setSetting} = useSettings();
  const controllerRef = useRef<PlayerController | null>(
    providedController ?? null,
  );
  const controllerPromiseRef = useRef<Promise<PlayerController> | null>(null);
  const ownsControllerRef = useRef(false);
  const [controller, setController] = useState<PlayerController | null>(
    providedController ?? null,
  );
  const [snapshot, setSnapshot] = useState<PlayerControllerSnapshot>(
    () => providedController?.getSnapshot() ?? EMPTY_SNAPSHOT,
  );
  const [selectedBookId, setSelectedBookId] = useState(
    snapshot.bookId ?? CURRENT_BOOK,
  );

  useEffect(() => {
    if (!controller) {
      return;
    }
    setSnapshot(controller.getSnapshot());
    return controller.subscribe(next => {
      setSnapshot(next);
      if (next.bookId) {
        setSelectedBookId(next.bookId);
      }
    });
  }, [controller]);

  useEffect(
    () => () => {
      if (ownsControllerRef.current) {
        void controllerRef.current?.dispose().catch(() => {});
      }
    },
    [],
  );

  const ensureController = useCallback(async (): Promise<PlayerController> => {
    if (controllerRef.current) {
      return controllerRef.current;
    }
    if (!createController) {
      throw new Error('PlayerProvider has no controller factory');
    }
    if (!controllerPromiseRef.current) {
      controllerPromiseRef.current = createController()
        .then(created => {
          controllerRef.current = created;
          ownsControllerRef.current = true;
          setController(created);
          setSnapshot(created.getSnapshot());
          return created;
        })
        .catch(error => {
          controllerPromiseRef.current = null;
          throw error;
        });
    }
    return controllerPromiseRef.current;
  }, [createController]);

  const prepare = useCallback(
    async (bookId: string): Promise<PlayerController> => {
      const active = await ensureController();
      if (active.getSnapshot().bookId !== bookId) {
        await active.loadBook(bookId);
      }
      await active.configureControls({
        backwardSec: skipIntervals.back,
        forwardSec: skipIntervals.forward,
      });
      if (active.getSnapshot().rate !== speed) {
        await active.setRate(speed);
      }
      return active;
    },
    [ensureController, skipIntervals.back, skipIntervals.forward, speed],
  );

  useEffect(() => {
    if (!controller) {
      return;
    }
    void controller
      .configureControls({
        backwardSec: skipIntervals.back,
        forwardSec: skipIntervals.forward,
      })
      .catch(() => {});
  }, [controller, skipIntervals.back, skipIntervals.forward]);

  // The saved speed outlives the session; apply it once a controller exists.
  useEffect(() => {
    if (!controller || controller.getSnapshot().rate === speed) {
      return;
    }
    void controller.setRate(speed).catch(() => {});
  }, [controller, speed]);

  const [error, setError] = useState<string | null>(null);
  const dismissError = useCallback(() => setError(null), []);

  const run = useCallback((operation: () => Promise<void>) => {
    void operation().then(
      () => setError(null),
      failure => {
        console.warn('Player operation failed', failure);
        setError(
          failure instanceof PlaybackUnavailableError
            ? UNAVAILABLE_MESSAGE
            : FAILED_MESSAGE,
        );
      },
    );
  }, []);

  const play = useCallback(
    (id: string) => {
      setSelectedBookId(id);
      run(async () => {
        const active = await prepare(id);
        if (library.status(id) !== 'listening') {
          library.setStatus(id, 'listening');
        }
        await active.play();
      });
    },
    [library, prepare, run],
  );

  const toggle = useCallback(
    () =>
      run(async () => {
        const active = await prepare(selectedBookId);
        await active.toggle();
      }),
    [prepare, run, selectedBookId],
  );

  const skip = useCallback(
    (seconds: number) =>
      run(async () => {
        const active = await prepare(selectedBookId);
        await active.skipBy(seconds);
      }),
    [prepare, run, selectedBookId],
  );

  const seekTo = useCallback(
    (seconds: number) =>
      run(async () => {
        const active = await prepare(selectedBookId);
        await active.seekTo(seconds);
      }),
    [prepare, run, selectedBookId],
  );

  const cycleRate = useCallback(
    () =>
      run(async () => {
        const active = await prepare(selectedBookId);
        const currentRate = active.getSnapshot().rate;
        const next =
          RATES[(RATES.indexOf(currentRate) + 1) % RATES.length];
        setSetting('speed', next);
        await active.setRate(next);
      }),
    [prepare, run, selectedBookId, setSetting],
  );

  const setSleepTimer = useCallback(
    (timer: SleepTimer) =>
      run(async () => {
        const active = await prepare(selectedBookId);
        await active.setSleepTimer(timer);
      }),
    [prepare, run, selectedBookId],
  );

  const activeBookId = snapshot.bookId ?? selectedBookId;
  const book = getBook(activeBookId);
  const position = snapshot.bookId
    ? snapshot.positionSec
    : library.positionSec(activeBookId);

  const value = useMemo<PlayerValue>(
    () => ({
      book,
      position,
      playing: snapshot.state === 'playing',
      rate: snapshot.rate,
      play,
      toggle,
      skip,
      seekTo,
      cycleRate,
      sleepTimer: snapshot.sleepTimer,
      setSleepTimer,
      error,
      dismissError,
    }),
    [
      book,
      position,
      snapshot.state,
      snapshot.rate,
      snapshot.sleepTimer,
      play,
      toggle,
      skip,
      seekTo,
      cycleRate,
      setSleepTimer,
      error,
      dismissError,
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
