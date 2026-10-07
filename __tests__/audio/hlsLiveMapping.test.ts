import type {AudioTrack} from '../../app/audio';
import {RntpAudioEngine} from '../../app/audio/rntp/RntpAudioEngine';
import {FakeRntpDriver} from '../../app/audio/rntp/testing/FakeRntpDriver';

describe('HLS/live track mapping', () => {
  it('preserves HLS and live semantics in the native queue', async () => {
    const driver = new FakeRntpDriver();
    const engine = new RntpAudioEngine(driver);
    const track: AudioTrack = {
      id: 'live-1',
      bookId: 'live-work',
      renditionId: 'live-rendition',
      chapterId: 'live',
      title: 'Live author session',
      isLive: true,
      source: {
        kind: 'remote',
        uri: 'https://stream.example.test/live/master.m3u8',
        mimeType: 'application/x-mpegURL',
        streamType: 'hls',
      },
    };

    await engine.load([track]);

    expect(driver.queue[0]).toMatchObject({
      streamType: 'hls',
      isLiveStream: true,
      contentType: 'application/x-mpegURL',
    });
  });
});
