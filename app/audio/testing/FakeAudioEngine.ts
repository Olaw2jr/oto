import type {AudioEngine} from '../AudioEngine';
import type {
  AudioTrack,
  LoadOptions,
  PlaybackListener,
  PlaybackSnapshot,
  PlaybackState,
} from '../types';

export class FakeAudioEngine implements AudioEngine {
  private tracks: AudioTrack[] = [];
  private index = -1;
  private snapshot: PlaybackSnapshot = {
    state: 'idle',
    positionSec: 0,
    rate: 1,
  };
  private readonly listeners = new Set<PlaybackListener>();

  async load(tracks: AudioTrack[], options: LoadOptions = {}): Promise<void> {
    if (tracks.length === 0) {
      this.tracks = [];
      this.index = -1;
      this.snapshot = {
        state: 'idle',
        positionSec: 0,
        rate: this.snapshot.rate,
      };
      this.emit();
      return;
    }

    const startIndex = options.startIndex ?? 0;
    if (startIndex < 0 || startIndex >= tracks.length) {
      throw new Error(`Invalid audio queue index: ${startIndex}`);
    }

    this.tracks = [...tracks];
    this.index = startIndex;
    const track = this.tracks[this.index];
    const positionSec = this.clamp(
      options.positionSec ?? 0,
      track.durationSec,
    );

    this.snapshot = {
      state: 'ready',
      trackId: track.id,
      positionSec,
      durationSec: track.durationSec,
      rate: this.snapshot.rate,
    };
    this.emit();
  }

  async play(): Promise<void> {
    this.requireCurrentTrack();
    this.updateState('playing');
  }

  async pause(): Promise<void> {
    this.requireCurrentTrack();
    this.updateState('paused');
  }

  async seekTo(positionSec: number): Promise<void> {
    const track = this.requireCurrentTrack();
    this.snapshot = {
      ...this.snapshot,
      positionSec: this.clamp(positionSec, track.durationSec),
    };
    this.emit();
  }

  async skipBy(deltaSec: number): Promise<void> {
    await this.seekTo(this.snapshot.positionSec + deltaSec);
  }

  async skipToTrack(trackId: string): Promise<void> {
    const index = this.tracks.findIndex(track => track.id === trackId);
    if (index < 0) {
      throw new Error(`Unknown audio track: ${trackId}`);
    }

    this.index = index;
    const track = this.tracks[index];
    this.snapshot = {
      ...this.snapshot,
      trackId: track.id,
      positionSec: 0,
      durationSec: track.durationSec,
    };
    this.emit();
  }

  async setRate(rate: number): Promise<void> {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Invalid playback rate: ${rate}`);
    }
    this.snapshot = {...this.snapshot, rate};
    this.emit();
  }

  async getSnapshot(): Promise<PlaybackSnapshot> {
    return {...this.snapshot};
  }

  subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private updateState(state: PlaybackState): void {
    this.snapshot = {...this.snapshot, state};
    this.emit();
  }

  private requireCurrentTrack(): AudioTrack {
    const track = this.tracks[this.index];
    if (!track) {
      throw new Error('Audio engine has no loaded track');
    }
    return track;
  }

  private clamp(positionSec: number, durationSec?: number): number {
    const lower = Math.max(0, positionSec);
    return durationSec === undefined ? lower : Math.min(durationSec, lower);
  }

  private emit(): void {
    const snapshot = {...this.snapshot};
    this.listeners.forEach(listener => listener(snapshot));
  }
}
