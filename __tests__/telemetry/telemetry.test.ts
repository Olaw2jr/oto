import {FakeConnectivity} from '../../app/connectivity';
import {
  InMemoryTelemetryStore,
  QueuedTelemetry,
  sanitizeProps,
  TelemetryUploader,
  type TelemetryEvent,
} from '../../app/telemetry';

const at = '2026-10-09T12:00:00.000Z';

describe('sanitizeProps', () => {
  it('keeps short primitive values and drops anything that could carry personal data', () => {
    expect(
      sanitizeProps({
        bookId: 'book-1',
        attempts: 3,
        online: true,
        nested: {email: 'a@b.c'},
        list: ['x'],
        long: 'x'.repeat(500),
        missing: undefined,
      }),
    ).toEqual({bookId: 'book-1', attempts: 3, online: true, long: 'x'.repeat(200)});
  });
});

describe('QueuedTelemetry', () => {
  it('records errors, events and metrics with a timestamp', async () => {
    const store = new InMemoryTelemetryStore();
    const telemetry = new QueuedTelemetry(store, {now: () => at});

    telemetry.error(new TypeError('boom'), {where: 'player'});
    telemetry.event('playback.failed', {reason: 'unavailable'});
    telemetry.metric('startup.ms', 812);
    await telemetry.idle();

    const events = await store.oldest(10);
    expect(events.map(e => e.event)).toEqual([
      {kind: 'error', name: 'TypeError', message: 'boom', at, props: {where: 'player'}, stack: expect.any(String)},
      {kind: 'event', name: 'playback.failed', at, props: {reason: 'unavailable'}},
      {kind: 'metric', name: 'startup.ms', value: 812, at, props: {}},
    ]);
  });

  it('never throws, even if storing fails', async () => {
    const telemetry = new QueuedTelemetry(
      {
        add: async () => {
          throw new Error('disk full');
        },
        oldest: async () => [],
        remove: async () => {},
      },
      {now: () => at},
    );
    expect(() => telemetry.event('x')).not.toThrow();
    await expect(telemetry.idle()).resolves.toBeUndefined();
  });
});

describe('InMemoryTelemetryStore', () => {
  it('keeps only the newest events', async () => {
    const store = new InMemoryTelemetryStore(3);
    for (const name of ['a', 'b', 'c', 'd']) {
      await store.add({kind: 'event', name, at, props: {}});
    }
    expect((await store.oldest(10)).map(e => e.event.name)).toEqual(['b', 'c', 'd']);
  });
});

describe('TelemetryUploader', () => {
  const setup = (online = true) => {
    const store = new InMemoryTelemetryStore();
    const connectivity = new FakeConnectivity({online});
    const post = jest.fn(async (_path: string, _body: {events: TelemetryEvent[]}) => ({}));
    const uploader = new TelemetryUploader({
      store,
      connectivity,
      api: {post} as any,
      batchSize: 2,
    });
    return {store, connectivity, post, uploader};
  };
  const fill = async (store: InMemoryTelemetryStore, count: number) => {
    for (let i = 0; i < count; i++) {
      await store.add({kind: 'event', name: `e${i}`, at, props: {}});
    }
  };

  it('sends queued events in batches and removes them once accepted', async () => {
    const {store, post, uploader} = setup();
    await fill(store, 3);

    await uploader.flush();

    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[0][0]).toBe('/v1/telemetry');
    expect(post.mock.calls[0][1].events.map(e => e.name)).toEqual(['e0', 'e1']);
    expect(await store.oldest(10)).toEqual([]);
  });

  it('keeps events when the backend is unreachable', async () => {
    const {store, post, uploader} = setup();
    await fill(store, 2);
    post.mockRejectedValueOnce(new Error('timeout'));

    await uploader.flush();

    expect(await store.oldest(10)).toHaveLength(2);
  });

  it('waits while offline and sends when the connection comes back', async () => {
    const {store, connectivity, post, uploader} = setup(false);
    await fill(store, 1);
    const stop = uploader.start();

    await uploader.flush();
    expect(post).not.toHaveBeenCalled();

    connectivity.set({online: true});
    await uploader.idle();
    expect(post).toHaveBeenCalledTimes(1);
    stop();
  });
});
