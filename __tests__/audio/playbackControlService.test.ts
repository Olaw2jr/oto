import {FakeAudioEngine} from '../../app/audio/testing/FakeAudioEngine';
import {PlaybackControlService} from '../../app/audio/controls/PlaybackControlService';

describe('PlaybackControlService', () => {
  it('uses the configured audiobook skip intervals', async () => {
    const engine = new FakeAudioEngine();
    await engine.load([
      {
        id: 'track-1',
        bookId: 'book-1',
        renditionId: 'rendition-1',
        chapterId: 'chapter-1',
        title: 'Chapter 1',
        durationSec: 300,
        source: {kind: 'remote', uri: 'https://example.test/1.m4a'},
      },
    ]);
    await engine.seekTo(100);

    const controls = new PlaybackControlService(engine, {
      backwardSec: 15,
      forwardSec: 30,
    });

    await controls.skipBackward();
    expect((await engine.getSnapshot()).positionSec).toBe(85);

    await controls.skipForward();
    expect((await engine.getSnapshot()).positionSec).toBe(115);
  });

  it('reconfigures native controls when skip intervals change', async () => {
    const engine = new FakeAudioEngine();
    const controls = new PlaybackControlService(engine);

    await controls.setSkipIntervals({backwardSec: 10, forwardSec: 10});

    expect(engine.controlConfiguration).toEqual({
      backwardSec: 10,
      forwardSec: 10,
    });
  });

  it('delegates seek and playback-rate changes to AudioEngine', async () => {
    const engine = new FakeAudioEngine();
    await engine.load([
      {
        id: 'track-1',
        bookId: 'book-1',
        renditionId: 'rendition-1',
        chapterId: 'chapter-1',
        title: 'Chapter 1',
        durationSec: 300,
        source: {kind: 'remote', uri: 'https://example.test/1.m4a'},
      },
    ]);
    const controls = new PlaybackControlService(engine);

    await controls.seekTo(42);
    await controls.setRate(1.5);

    await expect(engine.getSnapshot()).resolves.toMatchObject({
      positionSec: 42,
      rate: 1.5,
    });
  });

  it('rejects invalid skip intervals', async () => {
    const engine = new FakeAudioEngine();
    const controls = new PlaybackControlService(engine);

    await expect(
      controls.setSkipIntervals({backwardSec: 0, forwardSec: 30}),
    ).rejects.toThrow('Skip intervals must be positive');
  });
});
