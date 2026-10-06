export type RntpPlaybackState =
  | 'none'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'loading'
  | 'buffering'
  | 'error'
  | 'ended';

export type RntpEventName =
  | 'playback-state'
  | 'playback-active-track-changed'
  | 'playback-progress-updated'
  | 'playback-queue-ended';

export type RntpTrack = {
  id: string;
  url: string;
  title: string;
  duration?: number;
  contentType?: string;
  bookId: string;
  renditionId: string;
  chapterId: string;
};

export type RntpProgress = {
  position: number;
  duration: number;
  buffered: number;
};

export type RntpCapability =
  | 'play'
  | 'pause'
  | 'seek-to'
  | 'jump-backward'
  | 'jump-forward'
  | 'skip-next'
  | 'skip-previous';

export type RntpUpdateOptions = {
  capabilities: RntpCapability[];
  compactCapabilities: RntpCapability[];
  backwardJumpInterval: number;
  forwardJumpInterval: number;
  progressUpdateEventInterval: number;
};

export type RntpSubscription = {
  remove(): void;
};

export interface RntpDriver {
  setupPlayer(): Promise<void>;
  reset(): Promise<void>;
  setQueue(tracks: RntpTrack[]): Promise<void>;
  skip(index: number, positionSec?: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(positionSec: number): Promise<void>;
  seekBy(deltaSec: number): Promise<void>;
  setRate(rate: number): Promise<void>;
  getRate(): Promise<number>;
  getProgress(): Promise<RntpProgress>;
  getPlaybackState(): Promise<RntpPlaybackState>;
  getActiveTrackIndex(): Promise<number | undefined>;
  updateOptions(options: RntpUpdateOptions): Promise<void>;
  addEventListener(
    event: RntpEventName,
    listener: () => void,
  ): RntpSubscription;
}
