import {
  InMemorySleepTimerStore,
  PlaybackServiceSleepTimer,
  SleepTimerController,
} from '../../app/audio/sleep';

describe('durable sleep timer', () => {
  it('persists an absolute deadline and pauses only when it expires', async () => {
    const store = new InMemorySleepTimerStore();
    let now = 1_000_000;
    const pause = jest.fn(async () => {});
    const controller = new SleepTimerController(store, () => now);
    const service = new PlaybackServiceSleepTimer(
      store,
      pause,
      () => now,
    );

    await controller.setMinutes(15);
    expect(await store.get()).toEqual({
      kind: 'deadline',
      deadlineAtMs: 1_900_000,
    });

    now = 1_899_999;
    await service.onProgress();
    expect(pause).not.toHaveBeenCalled();

    now = 1_900_000;
    await service.onProgress();
    expect(pause).toHaveBeenCalledTimes(1);
    await expect(store.get()).resolves.toBeNull();
  });

  it('pauses at the transition out of the armed chapter', async () => {
    const store = new InMemorySleepTimerStore();
    const pause = jest.fn(async () => {});
    const controller = new SleepTimerController(store);
    const service = new PlaybackServiceSleepTimer(store, pause);

    await controller.setEndOfChapter(3);
    await service.onActiveTrackChanged(2, 3);
    expect(pause).not.toHaveBeenCalled();

    await service.onActiveTrackChanged(3, 4);
    expect(pause).toHaveBeenCalledTimes(1);
    await expect(store.get()).resolves.toBeNull();
  });

  it('clears an armed timer explicitly', async () => {
    const store = new InMemorySleepTimerStore();
    const controller = new SleepTimerController(store);

    await controller.setMinutes(30);
    await controller.clear();

    await expect(store.get()).resolves.toBeNull();
  });

  it('rejects non-positive minute values and invalid chapter indexes', async () => {
    const store = new InMemorySleepTimerStore();
    const controller = new SleepTimerController(store);

    await expect(controller.setMinutes(0)).rejects.toThrow(
      'Sleep timer minutes must be positive',
    );
    await expect(controller.setEndOfChapter(-1)).rejects.toThrow(
      'Sleep timer chapter index must be non-negative',
    );
  });
});
