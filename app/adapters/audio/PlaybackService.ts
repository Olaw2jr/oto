import TrackPlayer, {Event} from 'react-native-track-player';

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
};
