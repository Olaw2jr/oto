import TrackPlayer, {
  Event,
  type Track,
} from 'react-native-track-player';

import type {
  RntpDriver,
  RntpEventName,
  RntpPlaybackState,
  RntpSubscription,
  RntpTrack,
} from './RntpDriver';

const EVENTS: Record<RntpEventName, Event> = {
  'playback-state': Event.PlaybackState,
  'playback-active-track-changed': Event.PlaybackActiveTrackChanged,
  'playback-progress-updated': Event.PlaybackProgressUpdated,
  'playback-queue-ended': Event.PlaybackQueueEnded,
};

export class NativeRntpDriver implements RntpDriver {
  async setupPlayer(): Promise<void> {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
      autoUpdateMetadata: true,
    });
  }

  async reset(): Promise<void> {
    await TrackPlayer.reset();
  }

  async setQueue(tracks: RntpTrack[]): Promise<void> {
    await TrackPlayer.setQueue(tracks as Track[]);
  }

  async skip(index: number, positionSec = 0): Promise<void> {
    await TrackPlayer.skip(index, positionSec);
  }

  async play(): Promise<void> {
    await TrackPlayer.play();
  }

  async pause(): Promise<void> {
    await TrackPlayer.pause();
  }

  async seekTo(positionSec: number): Promise<void> {
    await TrackPlayer.seekTo(positionSec);
  }

  async seekBy(deltaSec: number): Promise<void> {
    await TrackPlayer.seekBy(deltaSec);
  }

  async setRate(rate: number): Promise<void> {
    await TrackPlayer.setRate(rate);
  }

  getRate(): Promise<number> {
    return TrackPlayer.getRate();
  }

  getProgress() {
    return TrackPlayer.getProgress();
  }

  async getPlaybackState(): Promise<RntpPlaybackState> {
    return (await TrackPlayer.getPlaybackState()).state as RntpPlaybackState;
  }

  getActiveTrackIndex(): Promise<number | undefined> {
    return TrackPlayer.getActiveTrackIndex();
  }

  addEventListener(
    event: RntpEventName,
    listener: () => void,
  ): RntpSubscription {
    const add = TrackPlayer.addEventListener as unknown as (
      event: Event,
      listener: () => void,
    ) => RntpSubscription;
    return add(EVENTS[event], listener);
  }
}
