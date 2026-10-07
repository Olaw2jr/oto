import {FakeAudioEngine} from '../../app/audio';
import {
  InMemorySleepTimerStore,
  SleepTimerController,
} from '../../app/audio/sleep';
import type {AudioTrack} from '../../app/audio';
import {PlayerController} from '../../app/player';

const tracks: AudioTrack[] = [
  {
    id: 'track-1',
    bookId: 'book-1',
    renditionId: 'rendition-1',
    chapterId: 'chapter-1',
    title: 'Chapter 1',
    durationSec: 120,
    source: {kind: 'remote', uri: 'https://example.test/1.mp3'},
  },
  {
    id: 'track-2',
    bookId: 'book-1',
    renditionId: 'rendition-1',
    chapterId: 'chapter-2',
    title: 'Chapter 2',
    durationSec: 180,
    source: {kind: 'remote', uri: 'https://example.test/2.mp3'},
  },
];

describe('PlayerController sleep timer', () => {
  it('persists minute and end-of-current-chapter timers', async () => {
    const now = 1_000_000;
    const store = new InMemorySleepTimerStore();
    const sleepTimer = new SleepTimerController(store, () => now);
    const controller = new PlayerController(new FakeAudioEngine(), {
      sleepTimer,
      now: () => now,
    });

    await controller.load(tracks);
    await controller.setSleepTimer({kind: 'minutes', minutes: 15});

    await expect(store.get()).resolves.toEqual({
      kind: 'deadline',
      deadlineAtMs: now + 15 * 60 * 1000,
    });
    expect(controller.getSnapshot().sleepTimer).toEqual({
      kind: 'minutes',
      minutes: 15,
    });

    await controller.seekTo(130);
    await controller.setSleepTimer({kind: 'chapter'});

    await expect(store.get()).resolves.toEqual({
      kind: 'chapter',
      trackIndex: 1,
    });
    expect(controller.getSnapshot().sleepTimer).toEqual({kind: 'chapter'});

    await controller.setSleepTimer(null);
    await expect(store.get()).resolves.toBeNull();
  });

  it('restores a persisted timer when a queue is loaded', async () => {
    const now = 1_000_000;
    const store = new InMemorySleepTimerStore();
    await store.set({
      kind: 'deadline',
      deadlineAtMs: now + 20 * 60 * 1000,
    });
    const controller = new PlayerController(new FakeAudioEngine(), {
      sleepTimer: new SleepTimerController(store, () => now),
      now: () => now,
    });

    await controller.load(tracks);

    expect(controller.getSnapshot().sleepTimer).toEqual({
      kind: 'minutes',
      minutes: 20,
    });
  });
});
