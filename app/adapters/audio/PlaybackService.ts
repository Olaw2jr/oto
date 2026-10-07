import TrackPlayer, {Event} from 'react-native-track-player';

import {PlaybackServiceSleepTimer} from '../../audio/sleep';
import {AsyncStorageSleepTimerStore} from './AsyncStorageSleepTimerStore';

const sleepTimer = new PlaybackServiceSleepTimer(
  new AsyncStorageSleepTimerStore('oto.audio.sleepTimer'),
  () => TrackPlayer.pause(),
);

const ignore = (work: Promise<void>) => {
  return work.catch(() => {});
};

const ignoreQueueBoundary = async (work: () => Promise<void>) => {
  try {
    await work();
  } catch {
    // A remote skip at either queue boundary is expected to be a no-op.
  }
};

export const PlaybackService = async (): Promise<void> => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

  TrackPlayer.addEventListener(Event.RemoteSeek, event =>
    TrackPlayer.seekTo(event.position),
  );
  TrackPlayer.addEventListener(Event.RemoteJumpForward, event =>
    TrackPlayer.seekBy(event.interval),
  );
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, event =>
    TrackPlayer.seekBy(-event.interval),
  );

  TrackPlayer.addEventListener(Event.RemoteNext, () =>
    ignoreQueueBoundary(() => TrackPlayer.skipToNext()),
  );
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    ignoreQueueBoundary(() => TrackPlayer.skipToPrevious()),
  );

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, () =>
    ignore(sleepTimer.onProgress()),
  );
  TrackPlayer.addEventListener(
    Event.PlaybackActiveTrackChanged,
    event =>
      ignore(
        sleepTimer.onActiveTrackChanged(
          event.lastIndex,
          event.index,
        ),
      ),
  );
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, event =>
    ignore(sleepTimer.onQueueEnded(event.track)),
  );
};
