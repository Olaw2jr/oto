import type {AudioEngine} from '../audio/AudioEngine';
import {ChapterPlaybackSession} from '../audio/session/ChapterPlaybackSession';
import type {SleepTimerState} from '../audio/sleep/types';
import type {
  AudioTrack,
  PlaybackControlConfiguration,
  PlaybackSnapshot,
  PlaybackState,
} from '../audio/types';
import type {
  PlaybackQueueResolver,
  ResolvedPlaybackQueue,
} from './PlaybackQueueResolver';

export type PlayerSleepTimer =
  | {kind: 'minutes'; minutes: number}
  | {kind: 'chapter'}
  | null;

export interface PlayerSleepTimerController {
  setMinutes(minutes: number): Promise<void>;
  setEndOfChapter(trackIndex: number): Promise<void>;
  clear(): Promise<void>;
  getState(): Promise<SleepTimerState | null>;
}

export type PlayerControllerSnapshot = {
  state: PlaybackState;
  bookId?: string;
  renditionId?: string;
  trackId?: string;
  positionSec: number;
  durationSec: number;
  rate: number;
  sleepTimer: PlayerSleepTimer;
};

export type PlayerLoadOptions = {
  positionSec?: number;
};

export type PlayerControllerDependencies = {
  session?: ChapterPlaybackSession;
  queueResolver?: PlaybackQueueResolver;
  sleepTimer?: PlayerSleepTimerController;
  now?: () => number;
};

type Listener = (snapshot: PlayerControllerSnapshot) => void;

type QueueState = {
  tracks: AudioTrack[];
  offsets: number[];
  durationSec: number;
  bookId: string;
  renditionId: string;
};

const durationOf = (track: AudioTrack): number => {
  if (
    track.durationSec === undefined ||
    !Number.isFinite(track.durationSec) ||
    track.durationSec <= 0
  ) {
    throw new Error(
      `Player track ${track.id} requires a positive duration`,
    );
  }
  return track.durationSec;
};

const buildQueue = (tracks: AudioTrack[]): QueueState => {
  if (!tracks.length) {
    throw new Error('Player queue cannot be empty');
  }

  const {bookId, renditionId} = tracks[0];
  if (
    tracks.some(
      track =>
        track.bookId !== bookId || track.renditionId !== renditionId,
    )
  ) {
    throw new Error(
      'Player queue tracks must belong to the same book and rendition',
    );
  }

  const offsets: number[] = [];
  let durationSec = 0;
  for (const track of tracks) {
    offsets.push(durationSec);
    durationSec += durationOf(track);
  }

  return {
    tracks: [...tracks],
    offsets,
    durationSec,
    bookId,
    renditionId,
  };
};

const locate = (
  queue: QueueState,
  positionSec: number,
): {index: number; positionSec: number} => {
  const clamped = Math.min(
    queue.durationSec,
    Math.max(0, positionSec),
  );

  for (let index = queue.tracks.length - 1; index >= 0; index -= 1) {
    if (clamped >= queue.offsets[index]) {
      return {
        index,
        positionSec: Math.min(
          durationOf(queue.tracks[index]),
          clamped - queue.offsets[index],
        ),
      };
    }
  }

  return {index: 0, positionSec: 0};
};

export class PlayerController {
  private queue: QueueState | null = null;
  private resolvedQueue: ResolvedPlaybackQueue | null = null;
  private snapshot: PlayerControllerSnapshot = {
    state: 'idle',
    positionSec: 0,
    durationSec: 0,
    rate: 1,
    sleepTimer: null,
  };
  private readonly listeners = new Set<Listener>();
  private unsubscribeEngine: (() => void) | null = null;
  private readonly now: () => number;

  constructor(
    private readonly engine: AudioEngine,
    private readonly dependencies: PlayerControllerDependencies = {},
  ) {
    this.now = dependencies.now ?? Date.now;
  }

  async load(
    tracks: AudioTrack[],
    options: PlayerLoadOptions = {},
  ): Promise<void> {
    const queue = buildQueue(tracks);
    const start = locate(queue, options.positionSec ?? 0);
    await this.resolvedQueue?.dispose();
    this.resolvedQueue = null;
    this.queue = queue;

    this.ensureEngineSubscription();
    await this.engine.load(tracks, {
      startIndex: start.index,
      positionSec: start.positionSec,
    });
    this.updateFromEngine(await this.engine.getSnapshot());
    await this.restoreSleepTimer();
  }

  async loadBook(bookId: string): Promise<void> {
    const resolver = this.dependencies.queueResolver;
    if (!resolver) {
      throw new Error('Player controller has no playback queue resolver');
    }

    const resolved = await resolver.resolve(bookId);
    const nextQueue = buildQueue(resolved.tracks);
    const previousQueue = this.queue;
    const previousResolved = this.resolvedQueue;

    this.queue = nextQueue;
    this.ensureEngineSubscription();

    try {
      if (this.dependencies.session) {
        await this.dependencies.session.load(
          resolved.bookId,
          resolved.renditionId,
          resolved.tracks,
        );
      } else {
        await this.engine.load(resolved.tracks);
      }
      this.resolvedQueue = resolved;
      this.updateFromEngine(await this.engine.getSnapshot());
      await this.restoreSleepTimer();
      await previousResolved?.dispose();
    } catch (error) {
      this.queue = previousQueue;
      await resolved.dispose();
      throw error;
    }
  }

  async play(): Promise<void> {
    await this.engine.play();
    this.updateFromEngine(await this.engine.getSnapshot());
  }

  async pause(): Promise<void> {
    await this.engine.pause();
    this.updateFromEngine(await this.engine.getSnapshot());
  }

  async toggle(): Promise<void> {
    if (this.snapshot.state === 'playing') {
      await this.pause();
    } else {
      await this.play();
    }
  }

  async seekTo(positionSec: number): Promise<void> {
    const queue = this.requireQueue();
    const target = locate(queue, positionSec);
    const track = queue.tracks[target.index];

    if (track.id !== this.snapshot.trackId) {
      await this.engine.skipToTrack(track.id);
    }
    await this.engine.seekTo(target.positionSec);
    this.updateFromEngine(await this.engine.getSnapshot());
  }

  async skipBy(deltaSec: number): Promise<void> {
    await this.seekTo(this.snapshot.positionSec + deltaSec);
  }

  async setRate(rate: number): Promise<void> {
    await this.engine.setRate(rate);
    this.updateFromEngine(await this.engine.getSnapshot());
  }

  configureControls(
    configuration: PlaybackControlConfiguration,
  ): Promise<void> {
    return this.engine.configureControls(configuration);
  }

  async setSleepTimer(timer: PlayerSleepTimer): Promise<void> {
    const controller = this.dependencies.sleepTimer;
    if (!controller) {
      throw new Error('Player controller has no sleep-timer controller');
    }

    if (timer === null) {
      await controller.clear();
    } else if (timer.kind === 'minutes') {
      await controller.setMinutes(timer.minutes);
    } else {
      const queue = this.requireQueue();
      const index = this.snapshot.trackId
        ? queue.tracks.findIndex(track => track.id === this.snapshot.trackId)
        : -1;
      if (index < 0) {
        throw new Error(
          'Cannot arm chapter sleep timer without an active track',
        );
      }
      await controller.setEndOfChapter(index);
    }

    this.snapshot = {...this.snapshot, sleepTimer: timer};
    this.emit();
  }

  getSnapshot = (): PlayerControllerSnapshot => ({...this.snapshot});

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async dispose(): Promise<void> {
    this.unsubscribeEngine?.();
    this.unsubscribeEngine = null;
    try {
      await this.dependencies.session?.dispose();
    } finally {
      await this.resolvedQueue?.dispose();
      this.resolvedQueue = null;
      this.queue = null;
      this.snapshot = {
        state: 'idle',
        positionSec: 0,
        durationSec: 0,
        rate: 1,
        sleepTimer: null,
      };
      this.emit();
    }
  }

  private async restoreSleepTimer(): Promise<void> {
    const controller = this.dependencies.sleepTimer;
    if (!controller) {
      return;
    }

    const state = await controller.getState();
    let sleepTimer: PlayerSleepTimer = null;
    if (state?.kind === 'chapter') {
      sleepTimer = {kind: 'chapter'};
    } else if (state?.kind === 'deadline') {
      const remainingMs = state.deadlineAtMs - this.now();
      if (remainingMs > 0) {
        sleepTimer = {
          kind: 'minutes',
          minutes: Math.max(1, Math.ceil(remainingMs / 60000)),
        };
      } else {
        await controller.clear();
      }
    }

    this.snapshot = {...this.snapshot, sleepTimer};
    this.emit();
  }

  private ensureEngineSubscription(): void {
    if (this.unsubscribeEngine) {
      return;
    }
    this.unsubscribeEngine = this.engine.subscribe(snapshot =>
      this.updateFromEngine(snapshot),
    );
  }

  private updateFromEngine(native: PlaybackSnapshot): void {
    const previousState = this.snapshot.state;
    const queue = this.queue;
    if (!queue) {
      this.snapshot = {
        state: native.state,
        positionSec: native.positionSec,
        durationSec: native.durationSec ?? 0,
        rate: native.rate,
        trackId: native.trackId,
        sleepTimer: this.snapshot.sleepTimer,
      };
      this.emit();
      this.refreshSleepTimerAfterPause(previousState, native.state);
      return;
    }

    const index = native.trackId
      ? queue.tracks.findIndex(track => track.id === native.trackId)
      : -1;
    const positionSec =
      index >= 0
        ? Math.min(
            queue.durationSec,
            queue.offsets[index] + Math.max(0, native.positionSec),
          )
        : 0;

    this.snapshot = {
      state: native.state,
      bookId: queue.bookId,
      renditionId: queue.renditionId,
      trackId: native.trackId,
      positionSec,
      durationSec: queue.durationSec,
      rate: native.rate,
      sleepTimer: this.snapshot.sleepTimer,
    };
    this.emit();
    this.refreshSleepTimerAfterPause(previousState, native.state);
  }

  private refreshSleepTimerAfterPause(
    previousState: PlaybackState,
    nextState: PlaybackState,
  ): void {
    if (
      previousState === 'playing' &&
      nextState === 'paused' &&
      this.snapshot.sleepTimer
    ) {
      this.restoreSleepTimer().catch(() => undefined);
    }
  }

  private requireQueue(): QueueState {
    if (!this.queue) {
      throw new Error('Player controller has no loaded queue');
    }
    return this.queue;
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(listener => listener(snapshot));
  }
}
