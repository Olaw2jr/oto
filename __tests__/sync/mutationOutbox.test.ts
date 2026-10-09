import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {MigrationRunner, migrations} from '../../app/storage/sqlite';
import {SqliteMutationOutbox} from '../../app/storage/sqlite/SqliteMutationOutbox';
import {
  InMemoryMutationOutbox,
  type MutationOutbox,
  type PendingMutation,
} from '../../app/sync';
import {openNodeSqlite} from '../storage/sqlite-test-utils';

let directory: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'oto-outbox-'));
});
afterEach(() => {
  rmSync(directory, {recursive: true, force: true});
});

const openSqliteOutbox = async (filename = join(directory, 'oto.sqlite')) => {
  const connection = openNodeSqlite(filename);
  await new MigrationRunner(connection.db, migrations).migrate();
  return {outbox: new SqliteMutationOutbox(connection.db), ...connection};
};

const implementations: [string, () => Promise<MutationOutbox>][] = [
  ['in memory', async () => new InMemoryMutationOutbox()],
  ['SQLite', async () => (await openSqliteOutbox()).outbox],
];

describe.each(implementations)('mutation outbox (%s)', (_, create) => {
  it('queues mutations in creation order', async () => {
    const outbox = await create();

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
    const outbox = await create();
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
    const outbox = await create();
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

  it('rejects a failure for an unknown mutation', async () => {
    const outbox = await create();
    await expect(
      outbox.fail('missing', {retryAt: '2026-10-05T10:05:00Z', error: 'x'}),
    ).rejects.toThrow('Unknown mutation: missing');
  });

  it('upserts the same mutation id to make enqueue idempotent', async () => {
    const outbox = await create();
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

  it('keeps the attempt count when a new mutation reuses an id', async () => {
    const outbox = await create();
    const mutation = {
      id: 'm1',
      kind: 'progress.update' as const,
      entityId: 'book-1',
      payload: {positionSec: 20},
      createdAt: '2026-10-05T10:00:00Z',
    };
    await outbox.enqueue(mutation);
    await outbox.fail('m1', {retryAt: '2026-10-05T10:00:01Z', error: 'x'});
    await outbox.enqueue({...mutation, payload: {positionSec: 25}});

    expect(await outbox.get('m1')).toMatchObject({
      attempts: 1,
      payload: {positionSec: 25},
    });
  });

  it('supports the listening mutations oto needs before social sync', async () => {
    const outbox = await create();
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

describe('SQLite mutation outbox', () => {
  it('keeps pending mutations and failures across a process restart', async () => {
    const filename = join(directory, 'restart.sqlite');
    const first = await openSqliteOutbox(filename);
    await first.outbox.enqueue({
      id: 'm1',
      kind: 'rating.set',
      entityId: 'book-1',
      payload: {stars: 4.5, nested: {source: 'book'}},
      createdAt: '2026-10-05T10:00:00Z',
    });
    await first.outbox.fail('m1', {
      retryAt: '2026-10-05T10:00:30Z',
      error: 'offline',
    });
    first.close();

    const second = await openSqliteOutbox(filename);
    try {
      expect(await second.outbox.get('m1')).toEqual({
        id: 'm1',
        kind: 'rating.set',
        entityId: 'book-1',
        payload: {stars: 4.5, nested: {source: 'book'}},
        createdAt: '2026-10-05T10:00:00Z',
        attempts: 1,
        retryAt: '2026-10-05T10:00:30Z',
        lastError: 'offline',
      });
    } finally {
      second.close();
    }
  });
});
