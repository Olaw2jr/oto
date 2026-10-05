import {
  FakeAudioEngine,
  type AudioTrack,
  type PlaybackSnapshot,
} from '../../app/audio';

const tracks: AudioTrack[] = [
  {
    id: 'book-1:chapter-1',
    bookId: 'book-1',
    renditionId: 'rendition-1',
    chapterId: 'chapter-1',
    title: 'Chapter 1',
    durationSec: 100,
    source: {
      kind: 'remote',
      uri: 'https://cdn.example.test/book-1/chapter-1.m4a',
    },
  },
  {
    id: 'book-1:chapter-2',
    bookId: 'book-1',
    renditionId: 'rendition-1',
    chapterId: 'chapter-2',
    title: 'Chapter 2',
    durationSec: 120,
    source: {
      kind: 'local',
      uri: 'file:///downloads/book-1/chapter-2.m4a',
    },
  },
];

describe('AudioEngine contract', () => {
  it('loads a mixed remote/local chapter queue without exposing RNTP', async () => {
    const engine = new FakeAudioEngine();

    await engine.load(tracks, {startIndex: 1, positionSec: 12});

    expect(await engine.getSnapshot()).toEqual({
      state: 'ready',
      trackId: tracks[1].id,
      positionSec: 12,
      durationSec: 120,
      rate: 1,
    });
  });

  it('supports play, pause, seek, skip and playback rate', async () => {
    const engine = new FakeAudioEngine();
    await engine.load(tracks);

    await engine.play();
    await engine.seekTo(30);
    await engine.skipBy(15);
    await engine.setRate(1.5);
    await engine.pause();

    expect(await engine.getSnapshot()).toEqual({
      state: 'paused',
      trackId: tracks[0].id,
      positionSec: 45,
      durationSec: 100,
      rate: 1.5,
    });
  });

  it('clamps seek and skip operations to track duration', async () => {
    const engine = new FakeAudioEngine();
    await engine.load(tracks);

    await engine.seekTo(500);
    expect((await engine.getSnapshot()).positionSec).toBe(100);

    await engine.skipBy(-500);
    expect((await engine.getSnapshot()).positionSec).toBe(0);
  });

  it('moves between chapter tracks while resetting position', async () => {
    const engine = new FakeAudioEngine();
    await engine.load(tracks);
    await engine.seekTo(80);

    await engine.skipToTrack(tracks[1].id);

    expect(await engine.getSnapshot()).toMatchObject({
      trackId: tracks[1].id,
      positionSec: 0,
      durationSec: 120,
    });
  });

  it('publishes snapshot changes to subscribers', async () => {
    const engine = new FakeAudioEngine();
    const snapshots: PlaybackSnapshot[] = [];
    const unsubscribe = engine.subscribe(snapshot => snapshots.push(snapshot));

    await engine.load(tracks);
    await engine.play();
    await engine.seekTo(10);
    unsubscribe();
    await engine.pause();

    expect(snapshots.map(snapshot => snapshot.state)).toEqual([
      'ready',
      'playing',
      'playing',
    ]);
    expect(snapshots.at(-1)?.positionSec).toBe(10);
  });

  it('rejects unknown track ids', async () => {
    const engine = new FakeAudioEngine();
    await engine.load(tracks);

    await expect(engine.skipToTrack('missing')).rejects.toThrow(
      'Unknown audio track: missing',
    );
  });
});
