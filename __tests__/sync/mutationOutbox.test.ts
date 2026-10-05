import {
  InMemoryMutationOutbox,
  type PendingMutation,
} from '../../app/sync';

describe('mutation outbox', () => {
  it('queues mutations in creation order', async () => {
    const outbox = new InMemoryMutationOutbox();

    await outbox.enqueue({
      id: 'm2',
      kind: 'progress.update',
      entityId: 'book-1',
      payload: {positionSec: 20},
      createdAt: '2026-10-05T10:00:02Z',
    });
    await outbox.enqueue({
      id: 'm1',
      kind: 'library.status',
      entityId: 'book-1',
      payload: {status: 'listening'},
      createdAt: '2026-10-05T10:00:01Z',
    });

    expect((await outbox.listReady(new Date('2026-10-05T10:01:00Z'))).map(x => x.id))
      .toEqual(['m1', 'm2']);
  });

  it('acknowledges successful mutations by removing them', async () => {
    const outbox = new InMemoryMutationOutbox();
    await outbox.enqueue({
      id: 'm1',
      kind: 'progress.update',
      entityId: 'book-1',
      payload: {positionSec: 42},
      createdAt: '2026-10-05T10:00:00Z',
    });

    await outbox.acknowledge('m1');

    expect(await outbox.get('m1')).toBeNull();
  });

  it('records failures and hides a mutation until its retry time', async () => {
    const outbox = new InMemoryMutationOutbox();
    await outbox.enqueue({
      id: 'm1',
      kind: 'progress.update',
      entityId: 'book-1',
      payload: {positionSec: 42},
      createdAt: '2026-10-05T10:00:00Z',
    });

    await outbox.fail('m1', {
      retryAt: '2026-10-05T10:05:00Z',
      error: 'network',
    });

    expect(await outbox.listReady(new Date('2026-10-05T10:04:59Z'))).toEqual([]);
    expect((await outbox.listReady(new Date('2026-10-05T10:05:00Z')))[0])
      .toMatchObject({
        id: 'm1',
        attempts: 1,
        lastError: 'network',
      });
  });

  it('upserts the same mutation id to make enqueue idempotent', async () => {
    const outbox = new InMemoryMutationOutbox();
    const first: PendingMutation = {
      id: 'm1',
      kind: 'progress.update',
      entityId: 'book-1',
      payload: {positionSec: 20},
      createdAt: '2026-10-05T10:00:00Z',
      attempts: 0,
    };

    await outbox.enqueue(first);
    await outbox.enqueue({...first, payload: {positionSec: 30}});

    const ready = await outbox.listReady(new Date('2026-10-05T11:00:00Z'));
    expect(ready).toHaveLength(1);
    expect(ready[0].payload).toEqual({positionSec: 30});
  });

  it('supports the listening mutations oto needs before social sync', async () => {
    const outbox = new InMemoryMutationOutbox();
    const kinds = [
      'library.status',
      'progress.update',
      'shelf.upsert',
      'rating.set',
    ] as const;

    for (const [index, kind] of kinds.entries()) {
      await outbox.enqueue({
        id: `m-${index}`,
        kind,
        entityId: 'book-1',
        payload: {},
        createdAt: `2026-10-05T10:00:0${index}Z`,
      });
    }

    expect((await outbox.listReady(new Date('2026-10-05T11:00:00Z'))).map(x => x.kind))
      .toEqual(kinds);
  });
});
