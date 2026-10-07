import type {AudioTrack} from '../../app/audio';
import {RntpAudioEngine} from '../../app/audio/rntp/RntpAudioEngine';
import {FakeRntpDriver} from '../../app/audio/rntp/testing/FakeRntpDriver';

const track: AudioTrack = {
  id: 'track-1',
  bookId: 'book-1',
  renditionId: 'rendition-1',
  chapterId: 'chapter-1',
  title: 'Chapter 1',
  durationSec: 300,
  source: {kind: 'remote', uri: 'https://example.test/chapter.m4a'},
};

describe('RNTP playback controls', () => {
  it('applies configured skip intervals before setup', async () => {
    const driver = new FakeRntpDriver();
    const engine = new RntpAudioEngine(driver);

    await engine.configureControls({
      backwardSec: 10,
      forwardSec: 20,
    });
    await engine.load([track]);

    expect(driver.options).toMatchObject({
      backwardJumpInterval: 10,
      forwardJumpInterval: 20,
    });
  });

  it('updates remote-control intervals after setup', async () => {
    const driver = new FakeRntpDriver();
    const engine = new RntpAudioEngine(driver);
    await engine.load([track]);

    await engine.configureControls({
      backwardSec: 30,
      forwardSec: 45,
    });

    expect(driver.options).toMatchObject({
      backwardJumpInterval: 30,
      forwardJumpInterval: 45,
    });
  });
});
