import type {AudioTrack} from '../../app/audio';
import {RntpAudioEngine} from '../../app/audio/rntp/RntpAudioEngine';
import {FakeRntpDriver} from '../../app/audio/rntp/testing/FakeRntpDriver';
import {waitFor} from '@testing-library/react-native';

const tracks: AudioTrack[] = [
  {
    id: 'book-1:chapter-1',
    bookId: 'book-1',
    renditionId: 'rendition-1',
    chapterId: 'chapter-1',
    title: 'Chapter 1',
    durationSec: 120,
    source: {
      kind: 'remote',
      uri: 'https://cdn.example.test/book-1/chapter-1.m4a',
      mimeType: 'audio/mp4',
    },
  },
  {
    id: 'book-1:chapter-2',
    bookId: 'book-1',
    renditionId: 'rendition-1',
    chapterId: 'chapter-2',
    title: 'Chapter 2',
    durationSec: 180,
    source: {
      kind: 'local',
      uri: 'file:///downloads/book-1/chapter-2.m4a',
      mimeType: 'audio/mp4',
    },
  },
];

describe('RntpAudioEngine', () => {
  it('sets up RNTP once and maps oto tracks into the native queue', async () => {
    const driver = new FakeRntpDriver();
    const engine = new RntpAudioEngine(driver);

    await engine.load(tracks, {startIndex: 1, positionSec: 17});
    await engine.load(tracks);

    expect(driver.setupCalls).toBe(1);
    expect(driver.queue[0]).toMatchObject({
      id: tracks[0].id,
      url: tracks[0].source.uri,
      title: tracks[0].title,
      duration: tracks[0].durationSec,
      contentType: tracks[0].source.mimeType,
      bookId: tracks[0].bookId,
      renditionId: tracks[0].renditionId,
      chapterId: tracks[0].chapterId,
    });
    expect(driver.activeIndex).toBe(0);
  });

  it('delegates transport controls through the AudioEngine contract', async () => {
    const driver = new FakeRntpDriver();
    const engine = new RntpAudioEngine(driver);
    await engine.load(tracks);

    await engine.play();
    await engine.seekTo(30);
    await engine.skipBy(15);
    await engine.setRate(1.5);
    await engine.pause();

    expect(driver.position).toBe(45);
    expect(driver.rate).toBe(1.5);
    expect(driver.state).toBe('paused');
  });

  it('skips to an oto track id and returns an oto playback snapshot', async () => {
    const driver = new FakeRntpDriver();
    const engine = new RntpAudioEngine(driver);
    await engine.load(tracks);

    await engine.skipToTrack(tracks[1].id);
    driver.position = 12;
    driver.state = 'playing';

    await expect(engine.getSnapshot()).resolves.toEqual({
      state: 'playing',
      trackId: tracks[1].id,
      positionSec: 12,
      durationSec: 180,
      rate: 1,
    });
  });

  it('publishes native playback changes to subscribers', async () => {
    const driver = new FakeRntpDriver();
    const engine = new RntpAudioEngine(driver);
    const listener = jest.fn();

    await engine.load(tracks);
    const unsubscribe = engine.subscribe(listener);

    driver.position = 33;
    driver.emit('playback-progress-updated');

    await waitFor(() =>
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId: tracks[0].id,
          positionSec: 33,
        }),
      ),
    );

    unsubscribe();
  });

  it('rejects unknown oto track ids', async () => {
    const driver = new FakeRntpDriver();
    const engine = new RntpAudioEngine(driver);
    await engine.load(tracks);

    await expect(engine.skipToTrack('missing')).rejects.toThrow(
      'Unknown audio track: missing',
    );
  });
});
