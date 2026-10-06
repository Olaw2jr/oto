import {
  configureBackgroundPlayback,
} from '../../app/audio/rntp/configureBackgroundPlayback';
import {FakeRntpDriver} from '../../app/audio/rntp/testing/FakeRntpDriver';

describe('RNTP background playback configuration', () => {
  it('enables audiobook remote controls with configurable skip intervals', async () => {
    const driver = new FakeRntpDriver();

    await configureBackgroundPlayback(driver, {
      backwardSec: 15,
      forwardSec: 30,
    });

    expect(driver.options).toEqual({
      capabilities: [
        'play',
        'pause',
        'seek-to',
        'jump-backward',
        'jump-forward',
        'skip-next',
        'skip-previous',
      ],
      compactCapabilities: ['play', 'pause', 'jump-backward', 'jump-forward'],
      backwardJumpInterval: 15,
      forwardJumpInterval: 30,
      progressUpdateEventInterval: 1,
    });
  });
});
