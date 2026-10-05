import {
  FakeBackgroundScheduler,
  type BackgroundTaskName,
} from '../../app/background';

describe('background scheduler contract', () => {
  it('schedules sync work with execution constraints', async () => {
    const scheduler = new FakeBackgroundScheduler();

    await scheduler.schedule('sync.flush', {
      earliestStartAt: '2026-10-05T12:00:00Z',
      requiresNetwork: true,
    });

    expect(scheduler.scheduled()).toEqual([
      {
        name: 'sync.flush',
        options: {
          earliestStartAt: '2026-10-05T12:00:00Z',
          requiresNetwork: true,
        },
      },
    ]);
  });

  it('runs registered handlers deterministically in tests', async () => {
    const scheduler = new FakeBackgroundScheduler();
    const calls: BackgroundTaskName[] = [];

    scheduler.register('playback.progress.flush', async () => {
      calls.push('playback.progress.flush');
    });

    await scheduler.run('playback.progress.flush');

    expect(calls).toEqual(['playback.progress.flush']);
  });

  it('supports download recovery without requiring network for local work', async () => {
    const scheduler = new FakeBackgroundScheduler();

    await scheduler.schedule('downloads.resume', {
      requiresNetwork: false,
    });

    expect(scheduler.scheduled()[0]).toMatchObject({
      name: 'downloads.resume',
      options: {requiresNetwork: false},
    });
  });

  it('cancels scheduled work by task name', async () => {
    const scheduler = new FakeBackgroundScheduler();
    await scheduler.schedule('sync.flush', {requiresNetwork: true});
    await scheduler.schedule('downloads.resume', {requiresNetwork: true});

    await scheduler.cancel('sync.flush');

    expect(scheduler.scheduled().map(task => task.name)).toEqual([
      'downloads.resume',
    ]);
  });

  it('unregisters handlers without leaking platform callbacks', async () => {
    const scheduler = new FakeBackgroundScheduler();
    let calls = 0;
    const unregister = scheduler.register('sync.flush', async () => {
      calls += 1;
    });

    unregister();

    await expect(scheduler.run('sync.flush')).rejects.toThrow(
      'No background handler registered for sync.flush',
    );
    expect(calls).toBe(0);
  });
});
