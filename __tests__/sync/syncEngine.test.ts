import {FakeBackgroundScheduler} from '../../app/background';
import {FakeConnectivity} from '../../app/connectivity';
import {
  InMemoryMutationOutbox,
  MutationRejectedError,
  retryDelayMs,
  SyncEngine,
  type MutationSender,
  type NewMutation,
  type PendingMutation,
} from '../../app/sync';

const at = (seconds: number) =>
  new Date(Date.UTC(2026, 9, 9, 10, 0, seconds));

const mutation = (id: string, second: number): NewMutation => ({
  id,
  kind: 'library.status',
  entityId: 'book-1',
  payload: {status: 'want'},
  createdAt: at(second).toISOString(),
});

const setup = async ({
  online = true,
  send = jest.fn<Promise<void>, [PendingMutation]>(async () => {}),
}: {
  online?: boolean;
  send?: jest.Mock<Promise<void>, [PendingMutation]>;
} = {}) => {
  const outbox = new InMemoryMutationOutbox();
  const connectivity = new FakeConnectivity({online});
  const scheduler = new FakeBackgroundScheduler();
  const sender: MutationSender = {send};
  let now = at(30);
  const onRejected = jest.fn();
  const engine = new SyncEngine({
    outbox,
    sender,
    connectivity,
    scheduler,
    now: () => now,
    random: () => 0.5,
    onRejected,
  });
  return {
    outbox,
    connectivity,
    scheduler,
    send,
    engine,
    onRejected,
    advanceTo: (date: Date) => {
      now = date;
    },
  };
};

describe('retryDelayMs', () => {
  it('backs off exponentially from 2 seconds with full jitter', () => {
    expect(retryDelayMs(1, () => 1)).toBe(2_000);
    expect(retryDelayMs(2, () => 1)).toBe(4_000);
    expect(retryDelayMs(3, () => 0.5)).toBe(4_000);
    expect(retryDelayMs(1, () => 0)).toBe(0);
  });

  it('never waits more than 15 minutes', () => {
    expect(retryDelayMs(30, () => 1)).toBe(15 * 60_000);
  });
});

describe('SyncEngine', () => {
  it('sends ready changes oldest first and removes them once applied', async () => {
    const {outbox, engine, send} = await setup();
    await outbox.enqueue(mutation('m2', 2));
    await outbox.enqueue(mutation('m1', 1));

    expect(await engine.flush()).toEqual({sent: 2, rejected: 0, pending: 0});
    expect(send.mock.calls.map(([m]) => m.id)).toEqual(['m1', 'm2']);
    expect(await outbox.listReady(at(60))).toEqual([]);
  });

  it('does nothing while offline', async () => {
    const {outbox, engine, send} = await setup({online: false});
    await outbox.enqueue(mutation('m1', 1));

    expect(await engine.flush()).toEqual({sent: 0, rejected: 0, pending: 1});
    expect(send).not.toHaveBeenCalled();
  });

  it('stops at the first failure so later changes keep their order', async () => {
    const send = jest
      .fn<Promise<void>, [PendingMutation]>()
      .mockRejectedValueOnce(new Error('timeout'));
    const {outbox, engine, scheduler} = await setup({send});
    await outbox.enqueue(mutation('m1', 1));
    await outbox.enqueue(mutation('m2', 2));

    expect(await engine.flush()).toEqual({sent: 0, rejected: 0, pending: 2});
    expect(send).toHaveBeenCalledTimes(1);
    // attempt 1, jitter 0.5 → 1 second after now
    expect(await outbox.get('m1')).toMatchObject({
      attempts: 1,
      lastError: 'timeout',
      retryAt: at(31).toISOString(),
    });
    expect(scheduler.scheduled()).toEqual([
      {
        name: 'sync.flush',
        options: {earliestStartAt: at(31).toISOString(), requiresNetwork: true},
      },
    ]);
  });

  it('retries with the same id so the server can ignore duplicates', async () => {
    const send = jest
      .fn<Promise<void>, [PendingMutation]>()
      .mockRejectedValueOnce(new Error('timeout'));
    const {outbox, engine, advanceTo} = await setup({send});
    await outbox.enqueue(mutation('m1', 1));
    await engine.flush();
    advanceTo(at(31));
    await engine.flush();

    expect(send.mock.calls.map(([m]) => [m.id, m.attempts])).toEqual([
      ['m1', 0],
      ['m1', 1],
    ]);
    expect(await outbox.get('m1')).toBeNull();
  });

  it('drops a change the server rejects and reports it', async () => {
    const send = jest
      .fn<Promise<void>, [PendingMutation]>()
      .mockRejectedValueOnce(new MutationRejectedError('book not found'));
    const {outbox, engine, onRejected} = await setup({send});
    await outbox.enqueue(mutation('m1', 1));
    await outbox.enqueue(mutation('m2', 2));

    expect(await engine.flush()).toEqual({sent: 1, rejected: 1, pending: 0});
    expect(onRejected).toHaveBeenCalledWith(
      expect.objectContaining({id: 'm1'}),
      'book not found',
    );
  });

  it('shares one flush between overlapping calls', async () => {
    let release: () => void = () => {};
    const send = jest.fn<Promise<void>, [PendingMutation]>(
      () => new Promise<void>(resolve => (release = resolve)),
    );
    const {outbox, engine} = await setup({send});
    await outbox.enqueue(mutation('m1', 1));

    const first = engine.flush();
    const second = engine.flush();
    await Promise.resolve();
    await Promise.resolve();
    release();
    expect(await first).toBe(await second);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('flushes when the connection comes back and from the background task', async () => {
    const {outbox, engine, connectivity, scheduler, send} = await setup({
      online: false,
    });
    await outbox.enqueue(mutation('m1', 1));
    const stop = engine.start();

    connectivity.set({online: true});
    await engine.idle();
    expect(send).toHaveBeenCalledTimes(1);

    await outbox.enqueue(mutation('m2', 2));
    await scheduler.run('sync.flush');
    expect(send).toHaveBeenCalledTimes(2);

    stop();
    await outbox.enqueue(mutation('m3', 3));
    connectivity.set({online: false});
    connectivity.set({online: true});
    await engine.idle();
    expect(send).toHaveBeenCalledTimes(2);
    await expect(scheduler.run('sync.flush')).rejects.toThrow();
  });
});
