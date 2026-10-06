import type {
  RntpDriver,
  RntpEventName,
  RntpPlaybackState,
  RntpSubscription,
  RntpTrack,
} from '../RntpDriver';

export class FakeRntpDriver implements RntpDriver {
  setupCalls = 0;
  queue: RntpTrack[] = [];
  activeIndex: number | undefined;
  position = 0;
  buffered = 0;
  rate = 1;
  state: RntpPlaybackState = 'none';

  private readonly listeners = new Map<
    RntpEventName,
    Set<() => void>
  >();

  async setupPlayer(): Promise<void> {
    this.setupCalls += 1;
    this.state = 'ready';
  }

  async reset(): Promise<void> {
    this.queue = [];
    this.activeIndex = undefined;
    this.position = 0;
    this.buffered = 0;
    this.state = 'none';
  }

  async setQueue(tracks: RntpTrack[]): Promise<void> {
    this.queue = [...tracks];
    this.activeIndex = tracks.length ? 0 : undefined;
    this.position = 0;
    this.state = tracks.length ? 'ready' : 'none';
  }

  async skip(index: number, positionSec = 0): Promise<void> {
    if (!this.queue[index]) {
      throw new Error(`Invalid RNTP queue index: ${index}`);
    }
    this.activeIndex = index;
    this.position = Math.max(0, positionSec);
    this.state = 'ready';
  }

  async play(): Promise<void> {
    this.state = 'playing';
    this.emit('playback-state');
  }

  async pause(): Promise<void> {
    this.state = 'paused';
    this.emit('playback-state');
  }

  async seekTo(positionSec: number): Promise<void> {
    this.position = Math.max(0, positionSec);
    this.emit('playback-progress-updated');
  }

  async seekBy(deltaSec: number): Promise<void> {
    await this.seekTo(this.position + deltaSec);
  }

  async setRate(rate: number): Promise<void> {
    this.rate = rate;
  }

  async getRate(): Promise<number> {
    return this.rate;
  }

  async getProgress() {
    const duration =
      this.activeIndex === undefined
        ? 0
        : this.queue[this.activeIndex]?.duration ?? 0;
    return {
      position: this.position,
      duration,
      buffered: this.buffered,
    };
  }

  async getPlaybackState(): Promise<RntpPlaybackState> {
    return this.state;
  }

  async getActiveTrackIndex(): Promise<number | undefined> {
    return this.activeIndex;
  }

  addEventListener(
    event: RntpEventName,
    listener: () => void,
  ): RntpSubscription {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return {
      remove: () => listeners.delete(listener),
    };
  }

  emit(event: RntpEventName): void {
    this.listeners.get(event)?.forEach(listener => listener());
  }
}
