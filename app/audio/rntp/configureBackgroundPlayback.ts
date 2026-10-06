import type {RntpDriver} from './RntpDriver';

export type BackgroundPlaybackIntervals = {
  backwardSec: number;
  forwardSec: number;
};

export const configureBackgroundPlayback = async (
  driver: RntpDriver,
  intervals: BackgroundPlaybackIntervals = {
    backwardSec: 15,
    forwardSec: 30,
  },
): Promise<void> => {
  await driver.updateOptions({
    capabilities: [
      'play',
      'pause',
      'seek-to',
      'jump-backward',
      'jump-forward',
      'skip-next',
      'skip-previous',
    ],
    compactCapabilities: [
      'play',
      'pause',
      'jump-backward',
      'jump-forward',
    ],
    backwardJumpInterval: intervals.backwardSec,
    forwardJumpInterval: intervals.forwardSec,
    progressUpdateEventInterval: 1,
  });
};
