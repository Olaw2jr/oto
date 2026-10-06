import type {AudioTrack} from '../../app/audio';
import {LivePlaybackSession} from '../../app/audio/live/LivePlaybackSession';
import {FakeAudioEngine} from '../../app/audio/testing/FakeAudioEngine';

const liveTrack: AudioTrack = {
  id: 'live-1',
  bookId: 'live-work',
  renditionId: 'live-rendition',
  chapterId: 'live',
  title: 'Live author session',
  isLive: true,
  source: {
    kind: 'remote',
    uri: 'https://stream.example.test/live/master.m3u8',
    streamType: 'hls',
  },
};

describe('LivePlaybackSession', () => {
  it('loads and starts a live HLS source without requiring a duration', async () => {
    const engine = new FakeAudioEngine();
    const session = new LivePlaybackSession(engine);

    await session.load(liveTrack, {autoplay: true});

    await expect(engine.getSnapshot()).resolves.toMatchObject({
      trackId: liveTrack.id,
      state: 'playing',
    });
  });

  it('rejects a non-live track', async () => {
    const engine = new FakeAudioEngine();
    const session = new LivePlaybackSession(engine);

    await expect(
      session.load({...liveTrack, isLive: false}),
    ).rejects.toThrow('LivePlaybackSession requires a live track');
  });
});
