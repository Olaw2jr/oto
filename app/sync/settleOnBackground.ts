import type {SyncRecorder} from './SyncRecorder';

type AppStateLike = {
  addEventListener(
    type: 'change',
    listener: (state: string) => void,
  ): {remove(): void};
};

// Saves positions the recorder's throttle held back whenever the app leaves
// the foreground, so the last few seconds of listening aren't lost.
export const settleOnBackground = (
  recorder: SyncRecorder,
  appState: AppStateLike,
): (() => void) => {
  const subscription = appState.addEventListener('change', state => {
    if (state !== 'active') {
      recorder.settle().catch(() => {});
    }
  });
  return () => subscription.remove();
};
