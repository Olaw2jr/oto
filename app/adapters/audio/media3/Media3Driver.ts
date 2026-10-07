import type {
  RntpDriver,
  RntpEventName,
  RntpPlaybackState,
  RntpSubscription,
  RntpTrack,
  RntpUpdateOptions,
} from '../../../audio/rntp/RntpDriver';
import {
  nativeMedia3Bridge,
  subscribeToNativeMedia3,
  type Media3Bridge,
} from './NativeMedia3Bridge';

type NativeSubscriptionFactory = (
  listener: () => void,
) => () => void;

export class Media3Driver implements RntpDriver {
  constructor(
    private readonly bridge: Media3Bridge =
      nativeMedia3Bridge,
    private readonly subscribeNative:
      NativeSubscriptionFactory =
        subscribeToNativeMedia3,
  ) {}

  setupPlayer(): Promise<void> {
    return this.bridge.setup();
  }

  reset(): Promise<void> {
    return this.bridge.reset();
  }

  setQueue(tracks: RntpTrack[]): Promise<void> {
    return this.bridge.setQueue(tracks);
  }

  skip(index: number, positionSec = 0): Promise<void> {
    return this.bridge.skip(index, positionSec);
  }

  play(): Promise<void> {
    return this.bridge.play();
  }

  pause(): Promise<void> {
    return this.bridge.pause();
  }

  seekTo(positionSec: number): Promise<void> {
    return this.bridge.seekTo(positionSec);
  }

  seekBy(deltaSec: number): Promise<void> {
    return this.bridge.seekBy(deltaSec);
  }

  setRate(rate: number): Promise<void> {
    return this.bridge.setRate(rate);
  }

  async getRate(): Promise<number> {
    return (await this.bridge.getSnapshot()).rate;
  }

  async getProgress() {
    const snapshot = await this.bridge.getSnapshot();
    return {
      position: snapshot.positionSec,
      duration: snapshot.durationSec,
      buffered: snapshot.positionSec,
    };
  }

  async getPlaybackState(): Promise<RntpPlaybackState> {
    return (await this.bridge.getSnapshot())
      .state as RntpPlaybackState;
  }

  async getActiveTrackIndex():
    Promise<number | undefined> {
    const index =
      (await this.bridge.getSnapshot()).activeIndex;
    return index >= 0 ? index : undefined;
  }

  updateOptions(
    options: RntpUpdateOptions,
  ): Promise<void> {
    return this.bridge.updateOptions(options);
  }

  addEventListener(
    _event: RntpEventName,
    listener: () => void,
  ): RntpSubscription {
    const unsubscribe = this.subscribeNative(listener);
    return {remove: unsubscribe};
  }
}
