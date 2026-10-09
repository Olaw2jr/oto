import type {AudioTrack} from '../../app/audio';
import {FakeAudioEngine} from '../../app/audio';
import {PlayerController} from '../../app/player/PlayerController';

const tracks: AudioTrack[] = [
  {
    id: 'book-1:chapter-1',
    bookId: 'book-1',
    renditionId: 'rendition-1',
    chapterId: 'chapter-1',
    title: 'Chapter 1',
    durationSec: 120,
    source: {kind: 'remote', uri: 'https://example.test/chapter-1.mp3'},
  },
  {
    id: 'book-1:chapter-2',
    bookId: 'book-1',
    renditionId: 'rendition-1',
    chapterId: 'chapter-2',
    title: 'Chapter 2',
    durationSec: 180,
    source: {kind: 'remote', uri: 'https://example.test/chapter-2.mp3'},
  },
];

describe('PlayerController', () => {
  it('maps chapter-local engine snapshots into rendition-global position', async () => {
    const engine = new FakeAudioEngine();
    const controller = new PlayerController(engine);

    await controller.load(tracks, {positionSec: 135});
    await engine.play();

    expect(controller.getSnapshot()).toMatchObject({
      bookId: 'book-1',
      renditionId: 'rendition-1',
      trackId: 'book-1:chapter-2',
      positionSec: 135,
      durationSec: 300,
      state: 'playing',
    });
  });

  it('seeks and skips across chapter boundaries using global positions', async () => {
    const engine = new FakeAudioEngine();
    const controller = new PlayerController(engine);

    await controller.load(tracks, {positionSec: 110});
    await controller.skipBy(25);

    expect(await engine.getSnapshot()).toMatchObject({
      trackId: 'book-1:chapter-2',
      positionSec: 15,
    });
    expect(controller.getSnapshot().positionSec).toBe(135);

    await controller.seekTo(30);
    expect(await engine.getSnapshot()).toMatchObject({
      trackId: 'book-1:chapter-1',
      positionSec: 30,
    });
  });

  it('delegates playback state, rate and controls to AudioEngine', async () => {
    const engine = new FakeAudioEngine();
    const controller = new PlayerController(engine);

    await controller.load(tracks);
    await controller.play();
    await controller.setRate(1.5);
    await controller.configureControls({backwardSec: 10, forwardSec: 45});
    await controller.pause();

    expect(controller.getSnapshot()).toMatchObject({
      state: 'paused',
      rate: 1.5,
    });
    expect(engine.controlConfiguration).toEqual({
      backwardSec: 10,
      forwardSec: 45,
    });
  });

  it('refreshes sleep-timer state when the native timer pauses playback', async () => {
    const engine = new FakeAudioEngine();
    let storedTimer: {
      kind: 'deadline';
      deadlineAtMs: number;
    } | null = null;
    const sleepTimer = {
      setMinutes: async () => {
        storedTimer = {kind: 'deadline', deadlineAtMs: 60_000};
      },
      setEndOfChapter: async () => undefined,
      clear: async () => {
        storedTimer = null;
      },
      getState: async () => storedTimer,
    };
    const controller = new PlayerController(engine, {
      sleepTimer,
      now: () => 0,
    });

    await controller.load(tracks);
    await controller.play();
    await controller.setSleepTimer({kind: 'minutes', minutes: 1});
    expect(controller.getSnapshot().sleepTimer).toEqual({
      kind: 'minutes',
      minutes: 1,
    });

    // The native service clears its persisted timer before emitting the pause.
    storedTimer = null;
    await engine.pause();
    await Promise.resolve();

    expect(controller.getSnapshot()).toMatchObject({
      state: 'paused',
      sleepTimer: null,
    });
  });

  it('refreshes chapter timer state after a native track transition', async () => {
    const engine = new FakeAudioEngine();
    let storedTimer: {kind: 'chapter'; trackIndex: number} | null = null;
    const sleepTimer = {
      setMinutes: async () => undefined,
      setEndOfChapter: async (trackIndex: number) => {
        storedTimer = {kind: 'chapter', trackIndex};
      },
      clear: async () => {
        storedTimer = null;
      },
      getState: async () => storedTimer,
    };
    const controller = new PlayerController(engine, {sleepTimer});

    await controller.load(tracks);
    await controller.setSleepTimer({kind: 'chapter'});
    expect(controller.getSnapshot().sleepTimer).toEqual({kind: 'chapter'});

    // The native service clears its persisted timer as the active track changes.
    storedTimer = null;
    await engine.skipToTrack(tracks[1].id);
    await Promise.resolve();

    expect(controller.getSnapshot()).toMatchObject({
      trackId: tracks[1].id,
      sleepTimer: null,
    });
  });

  it('rejects mixed queues and tracks without finite positive durations', async () => {
    const controller = new PlayerController(new FakeAudioEngine());

    await expect(
      controller.load([
        tracks[0],
        {...tracks[1], bookId: 'book-2'},
      ]),
    ).rejects.toThrow('same book and rendition');

    await expect(
      controller.load([{...tracks[0], durationSec: undefined}]),
    ).rejects.toThrow('positive duration');
  });
});

// #138: a finished book kept its torrent sessions, loopback routes and
// downloads running until another book loaded.
describe('PlayerController at the end of a book', () => {
  const setup = () => {
    const engine = new FakeAudioEngine();
    const disposals: string[] = [];
    let loads = 0;
    const queueResolver = {
      resolve: jest.fn(async (bookId: string) => {
        loads += 1;
        const load = loads;
        return {
          bookId,
          renditionId: 'rendition-1',
          tracks,
          dispose: async () => {
            disposals.push(`load-${load}`);
          },
        };
      }),
    };
    const controller = new PlayerController(engine, {
      queueResolver: queueResolver as any,
    });
    return {engine, controller, queueResolver, disposals};
  };

  it('releases the book\'s playback sources when it ends', async () => {
    const {engine, controller, disposals} = setup();
    await controller.loadBook('book-1');
    await controller.play();

    engine.finish();
    await new Promise(resolve => setImmediate(resolve));

    expect(controller.getSnapshot().state).toBe('ended');
    expect(disposals).toEqual(['load-1']);
  });

  it('reloads the book and starts over when played again', async () => {
    const {engine, controller, queueResolver, disposals} = setup();
    await controller.loadBook('book-1');
    await controller.seekTo(299);
    await controller.play();
    engine.finish();
    await new Promise(resolve => setImmediate(resolve));

    await controller.play();

    expect(queueResolver.resolve).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot()).toMatchObject({
      bookId: 'book-1',
      state: 'playing',
      positionSec: 0,
    });
    expect(disposals).toEqual(['load-1']);
  });
});

