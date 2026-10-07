import type {AudioEngine} from '../audio/AudioEngine';
import type {
  AudioTrack,
  PlaybackControlConfiguration,
  PlaybackSnapshot,
  PlaybackState,
} from '../audio/types';

export type PlayerControllerSnapshot = {
  state: PlaybackState;
  bookId?: string;
  renditionId?: string;
  trackId?: string;
  positionSec: number;
  durationSec: number;
  rate: number;
};

export type PlayerLoadOptions = {
  positionSec?: number;
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
  private snapshot: PlayerControllerSnapshot = {
    state: 'idle',
    positionSec: 0,
    durationSec: 0,
    rate: 1,
  };
  private readonly listeners = new Set<Listener>();
  private unsubscribeEngine: (() => void) | null = null;

  constructor(private readonly engine: AudioEngine) {}

  async load(
    tracks: AudioTrack[],
    options: PlayerLoadOptions = {},
  ): Promise<void> {
    const queue = buildQueue(tracks);
    const start = locate(queue, options.positionSec ?? 0);
    this.queue = queue;

    this.ensureEngineSubscription();
    await this.engine.load(tracks, {
      startIndex: start.index,
      positionSec: start.positionSec,
    });
    this.updateFromEngine(await this.engine.getSnapshot());
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

  getSnapshot = (): PlayerControllerSnapshot => ({...this.snapshot});

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async dispose(): Promise<void> {
    this.unsubscribeEngine?.();
    this.unsubscribeEngine = null;
    this.queue = null;
    this.snapshot = {
      state: 'idle',
      positionSec: 0,
      durationSec: 0,
      rate: 1,
    };
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
    const queue = this.queue;
    if (!queue) {
      this.snapshot = {
        state: native.state,
        positionSec: native.positionSec,
        durationSec: native.durationSec ?? 0,
        rate: native.rate,
        trackId: native.trackId,
      };
      this.emit();
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
    };
    this.emit();
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
