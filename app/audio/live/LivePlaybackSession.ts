import type {AudioEngine} from '../AudioEngine';
import type {AudioTrack} from '../types';

export type LivePlaybackOptions = {
  autoplay?: boolean;
};

export class LivePlaybackSession {
  private track: AudioTrack | null = null;

  constructor(private readonly engine: AudioEngine) {}

  async load(
    track: AudioTrack,
    options: LivePlaybackOptions = {},
  ): Promise<void> {
    if (!track.isLive) {
      throw new Error('LivePlaybackSession requires a live track');
    }

    this.track = track;
    await this.engine.load([track]);

    if (options.autoplay) {
      await this.engine.play();
    }
  }

  async play(): Promise<void> {
    if (!this.track) {
      throw new Error('No live track is loaded');
    }
    await this.engine.play();
  }

  async pause(): Promise<void> {
    if (!this.track) {
      throw new Error('No live track is loaded');
    }
    await this.engine.pause();
  }

  async setRate(rate: number): Promise<void> {
    if (!this.track) {
      throw new Error('No live track is loaded');
    }
    await this.engine.setRate(rate);
  }
}
