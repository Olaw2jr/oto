import type {
  AudioTrack,
  LoadOptions,
  PlaybackListener,
  PlaybackSnapshot,
} from './types';

export interface AudioEngine {
  load(tracks: AudioTrack[], options?: LoadOptions): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(positionSec: number): Promise<void>;
  skipBy(deltaSec: number): Promise<void>;
  skipToTrack(trackId: string): Promise<void>;
  setRate(rate: number): Promise<void>;
  configureControls(
    configuration: import('./types').PlaybackControlConfiguration,
  ): Promise<void>;
  getSnapshot(): Promise<PlaybackSnapshot>;
  subscribe(listener: PlaybackListener): () => void;
}
