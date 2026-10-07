import TrackPlayer, {
  Capability,
  Event,
  IOSCategory,
  IOSCategoryMode,
  PitchAlgorithm,
  type Track,
} from 'react-native-track-player';

import type {
  RntpDriver,
  RntpEventName,
  RntpPlaybackState,
  RntpSubscription,
  RntpTrack,
  RntpUpdateOptions,
} from '../../audio/rntp/RntpDriver';

const CAPABILITIES = {
  play: Capability.Play,
  pause: Capability.Pause,
  'seek-to': Capability.SeekTo,
  'jump-backward': Capability.JumpBackward,
  'jump-forward': Capability.JumpForward,
  'skip-next': Capability.SkipToNext,
  'skip-previous': Capability.SkipToPrevious,
} as const;

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
      iosCategory: IOSCategory.Playback,
      iosCategoryMode: IOSCategoryMode.SpokenAudio,
    });
  }

  async reset(): Promise<void> {
    await TrackPlayer.reset();
  }

  async setQueue(tracks: RntpTrack[]): Promise<void> {
    await TrackPlayer.setQueue(
      tracks.map(track => ({
        ...track,
        pitchAlgorithm: PitchAlgorithm.Voice,
      })) as Track[],
    );
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

  async updateOptions(options: RntpUpdateOptions): Promise<void> {
    const capabilities = options.capabilities.map(
      capability => CAPABILITIES[capability],
    );
    await TrackPlayer.updateOptions({
      capabilities,
      notificationCapabilities: capabilities,
      compactCapabilities: options.compactCapabilities.map(
        capability => CAPABILITIES[capability],
      ),
      backwardJumpInterval: options.backwardJumpInterval,
      forwardJumpInterval: options.forwardJumpInterval,
      progressUpdateEventInterval: options.progressUpdateEventInterval,
    });
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
