import {
  FakeAudioEngine,
  type AudioTrack,
  type PlaybackSnapshot,
} from '../../app/audio';

const remoteTrack: AudioTrack = {
  id: 'chapter-1',
  bookId: 'book-1',
  chapterId: 'chapter-1',
  title: 'Chapter 1',
  durationSec: 120,
  source: {
    kind: 'remote',
    uri: 'https://cdn.oto.example/books/1/chapter-1.m4a',
    streamType: 'progressive',
    headers: {authorization: 'Bearer playback-token'},
  },
};

const hlsTrack: AudioTrack = {
  ...remoteTrack,
  id: 'chapter-2',
  chapterId: 'chapter-2',
  title: 'Chapter 2',
  source: {
    kind: 'remote',
    uri: 'https://cdn.oto.example/books/1/chapter-2.m3u8',
    streamType: 'hls',
  },
};

const localTrack: AudioTrack = {
  ...remoteTrack,
  id: 'chapter-3',
  chapterId: 'chapter-3',
  title: 'Chapter 3',
  source: {
    kind: 'local',
    uri: 'file:///downloads/book-1/chapter-3.m4a',
  },
};

describe('AudioEngine contract', () => {
  it('loads remote progressive, HLS and local tracks through one queue', async () => {
    const engine = new FakeAudioEngine();

    await engine.loadQueue([remoteTrack, hlsTrack, localTrack], 1);

    expect(await engine.getSnapshot()).toMatchObject({
      state: 'ready',
      trackId: 'chapter-2',
      queueIndex: 1,
      positionSec: 0,
      rate: 1,
    });
    expect(engine.queue).toEqual([remoteTrack, hlsTrack, localTrack]);
  });

  it('exposes playback controls without leaking a native player API', async () => {
    const engine = new FakeAudioEngine();
    await engine.loadQueue([remoteTrack]);

    await engine.play();
    await engine.seekTo(30);
    await engine.skipBy(15);
    await engine.setRate(1.5);

    expect(await engine.getSnapshot()).toMatchObject({
      state: 'playing',
      positionSec: 45,
      rate: 1.5,
    });

    await engine.pause();
    expect((await engine.getSnapshot()).state).toBe('paused');
  });

  it('clamps fake-engine seeking so service tests are deterministic', async () => {
    const engine = new FakeAudioEngine();
    await engine.loadQueue([remoteTrack]);

    await engine.seekTo(500);
    expect((await engine.getSnapshot()).positionSec).toBe(120);

    await engine.skipBy(-500);
    expect((await engine.getSnapshot()).positionSec).toBe(0);
  });

  it('publishes snapshots and returns an unsubscribe function', async () => {
    const engine = new FakeAudioEngine();
    const snapshots: PlaybackSnapshot[] = [];
    const unsubscribe = engine.subscribe(snapshot => snapshots.push(snapshot));

    await engine.loadQueue([remoteTrack]);
    await engine.play();
    unsubscribe();
    await engine.pause();

    expect(snapshots.map(snapshot => snapshot.state)).toEqual([
      'ready',
      'playing',
    ]);
  });

  it('can move between queued chapters without changing source semantics', async () => {
    const engine = new FakeAudioEngine();
    await engine.loadQueue([remoteTrack, hlsTrack, localTrack]);

    await engine.selectTrack(2);

    expect(await engine.getSnapshot()).toMatchObject({
      trackId: 'chapter-3',
      queueIndex: 2,
      positionSec: 0,
    });
  });
});
