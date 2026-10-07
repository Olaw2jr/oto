import type {AudioEngine} from '../AudioEngine';
import type {
  AudioTrack,
  LoadOptions,
  PlaybackListener,
  PlaybackSnapshot,
  PlaybackState,
} from '../types';
import {configureBackgroundPlayback} from './configureBackgroundPlayback';
import type {
  RntpDriver,
  RntpPlaybackState,
  RntpTrack,
} from './RntpDriver';

const EVENTS = [
  'playback-state',
  'playback-active-track-changed',
  'playback-progress-updated',
  'playback-queue-ended',
] as const;

const mapState = (state: RntpPlaybackState): PlaybackState => {
  switch (state) {
    case 'none':
      return 'idle';
    case 'ready':
      return 'ready';
    case 'playing':
      return 'playing';
    case 'paused':
    case 'stopped':
      return 'paused';
    case 'loading':
    case 'buffering':
      return 'loading';
    case 'ended':
      return 'ended';
    case 'error':
      return 'error';
  }
};

const toNativeTrack = (track: AudioTrack): RntpTrack => ({
  id: track.id,
  url: track.source.uri,
  title: track.title,
  duration: track.durationSec,
  contentType: track.source.mimeType,
  bookId: track.bookId,
  renditionId: track.renditionId,
  chapterId: track.chapterId,
});

export class RntpAudioEngine implements AudioEngine {
  private initialized = false;
  private tracks: AudioTrack[] = [];

  constructor(private readonly driver: RntpDriver) {}

  private async ensureSetup(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.driver.setupPlayer();
    await configureBackgroundPlayback(this.driver);
    this.initialized = true;
  }

  async load(
    tracks: AudioTrack[],
    options: LoadOptions = {},
  ): Promise<void> {
    await this.ensureSetup();
    await this.driver.reset();
    this.tracks = [...tracks];

    if (!tracks.length) {
      return;
    }

    const startIndex = options.startIndex ?? 0;
    if (startIndex < 0 || startIndex >= tracks.length) {
      throw new Error(`Invalid audio queue index: ${startIndex}`);
    }

    await this.driver.setQueue(tracks.map(toNativeTrack));
    await this.driver.skip(startIndex, options.positionSec ?? 0);
  }

  async play(): Promise<void> {
    await this.ensureSetup();
    await this.driver.play();
  }

  async pause(): Promise<void> {
    await this.ensureSetup();
    await this.driver.pause();
  }

  async seekTo(positionSec: number): Promise<void> {
    await this.ensureSetup();
    const index = await this.driver.getActiveTrackIndex();
    const track = index === undefined ? undefined : this.tracks[index];
    const clamped = Math.max(
      0,
      track?.durationSec === undefined
        ? positionSec
        : Math.min(positionSec, track.durationSec),
    );
    await this.driver.seekTo(clamped);
  }

  async skipBy(deltaSec: number): Promise<void> {
    await this.ensureSetup();
    const snapshot = await this.getSnapshot();
    await this.seekTo(snapshot.positionSec + deltaSec);
  }

  async skipToTrack(trackId: string): Promise<void> {
    await this.ensureSetup();
    const index = this.tracks.findIndex(track => track.id === trackId);
    if (index < 0) {
      throw new Error(`Unknown audio track: ${trackId}`);
    }
    await this.driver.skip(index, 0);
  }

  async setRate(rate: number): Promise<void> {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Invalid playback rate: ${rate}`);
    }
    await this.ensureSetup();
    await this.driver.setRate(rate);
  }

  async getSnapshot(): Promise<PlaybackSnapshot> {
    await this.ensureSetup();
    const [progress, nativeState, index, rate] = await Promise.all([
      this.driver.getProgress(),
      this.driver.getPlaybackState(),
      this.driver.getActiveTrackIndex(),
      this.driver.getRate(),
    ]);
    const track = index === undefined ? undefined : this.tracks[index];

    return {
      state: mapState(nativeState),
      trackId: track?.id,
      positionSec: progress.position,
      durationSec: track?.durationSec ?? (progress.duration || undefined),
      rate,
    };
  }

  subscribe(listener: PlaybackListener): () => void {
    let active = true;
    const publish = async () => {
      try {
        const snapshot = await this.getSnapshot();
        if (active) {
          listener(snapshot);
        }
      } catch {
        // Native snapshots can be temporarily unavailable during service startup.
      }
    };
    const subscriptions = EVENTS.map(event =>
      this.driver.addEventListener(event, publish),
    );

    return () => {
      active = false;
      subscriptions.forEach(subscription => subscription.remove());
    };
  }
}
