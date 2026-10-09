import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPersistentApplicationContainer} from '../../app/composition/ApplicationContainer';
import {MigrationRunner, migrations} from '../../app/storage/sqlite';
import {openNodeSqlite as open} from './sqlite-test-utils';

describe('production persistence against SQLite', () => {
  let directory: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'oto-sqlite-'));
  });
  afterEach(() => {
    rmSync(directory, {recursive: true, force: true});
  });

  it('restores status and progress after closing and reopening the database', async () => {
    const filename = join(directory, 'oto.sqlite');
    const first = open(filename);
    const app = await createPersistentApplicationContainer(
      async () => first.db,
    );
    app.library.setStatus('starry-messenger', 'want');
    app.library.setPosition('starry-messenger', 123.5);
    await app.library.flush();
    first.close();
    const second = open(filename);
    try {
      const restored = await createPersistentApplicationContainer(
        async () => second.db,
      );
      expect(restored.library.status('starry-messenger')).toBe('listening');
      expect(restored.library.positionSec('starry-messenger')).toBe(123.5);
      expect(
        await restored.services.library.getPosition(
          'starry-messenger',
          'starry-messenger:seed',
        ),
      ).toBe(123.5);
      await restored.services.library.setPosition(
        'starry-messenger',
        'starry-messenger:seed',
        456,
      );
      expect(restored.library.positionSec('starry-messenger')).toBe(456);
      expect(await restored.storage.openDatabase()).toBe(second.db);
    } finally {
      second.close();
    }
  });

  it('restores ratings, shelves and bookmarks after reopening the database', async () => {
    const filename = join(directory, 'collections.sqlite');
    const first = open(filename);
    const app = await createPersistentApplicationContainer(
      async () => first.db,
    );
    expect(app.collections.initial).toEqual({
      ratings: {},
      shelves: [],
      bookmarks: {},
    });
    const {repository} = app.collections;
    await repository.saveRating('starry-messenger', 4.5);
    await repository.saveRating('greenlights', 3);
    await repository.saveRating('greenlights', null);
    await repository.saveShelf({
      id: 'road-trips',
      name: 'Road trips',
      bookIds: ['greenlights', 'starry-messenger'],
    });
    await repository.saveShelf({
      id: 'road-trips',
      name: 'Road trips',
      bookIds: ['starry-messenger'],
    });
    await repository.addBookmark('starry-messenger', 90);
    await repository.addBookmark('starry-messenger', 30);
    await repository.addBookmark('starry-messenger', 90);
    await repository.addBookmark('starry-messenger', 45);
    await repository.removeBookmark('starry-messenger', 45);
    first.close();

    const second = open(filename);
    try {
      const restored = await createPersistentApplicationContainer(
        async () => second.db,
      );
      expect(restored.collections.initial).toEqual({
        ratings: {'starry-messenger': 4.5},
        shelves: [
          {id: 'road-trips', name: 'Road trips', bookIds: ['starry-messenger']},
        ],
        bookmarks: {'starry-messenger': [30, 90]},
      });
    } finally {
      second.close();
    }
  });

  it('keeps changes waiting to sync after reopening the database', async () => {
    const filename = join(directory, 'outbox.sqlite');
    const first = open(filename);
    const app = await createPersistentApplicationContainer(
      async () => first.db,
    );
    await app.sync.outbox.enqueue({
      id: 'm1',
      kind: 'library.status',
      entityId: 'starry-messenger',
      payload: {status: 'want'},
      createdAt: '2026-10-09T10:00:00.000Z',
    });
    first.close();

    const second = open(filename);
    try {
      const restored = await createPersistentApplicationContainer(
        async () => second.db,
      );
      expect(
        (await restored.sync.outbox.listReady(new Date())).map(m => m.id),
      ).toEqual(['m1']);
    } finally {
      second.close();
    }
  });

  it('keeps telemetry waiting for the backend across a restart', async () => {
    const filename = join(directory, 'telemetry.sqlite');
    const first = open(filename);
    const app = await createPersistentApplicationContainer(
      async () => first.db,
    );
    app.telemetry.telemetry.event('app.opened', {cold: true});
    await app.telemetry.idle();
    first.close();

    const second = open(filename);
    try {
      const restored = await createPersistentApplicationContainer(
        async () => second.db,
      );
      const queued = await restored.telemetry.store.oldest(10);
      expect(queued.map(item => item.event)).toEqual([
        expect.objectContaining({kind: 'event', name: 'app.opened', props: {cold: true}}),
      ]);
    } finally {
      second.close();
    }
  });

  it('preserves legacy data and unrelated tables when upgrading and reopening', async () => {
    const connection = open(join(directory, 'legacy.sqlite'));
    try {
      await new MigrationRunner(
        connection.db,
        migrations.slice(0, 1),
      ).migrate();
      await connection.db.execute(
        "INSERT INTO library_entries VALUES ('starry-messenger', 'want', 42, 'old')",
      );
      await connection.db.execute(
        "INSERT INTO listening_progress VALUES ('starry-messenger', 42, 900, 'old')",
      );
      await connection.db.execute(
        "INSERT INTO ratings VALUES ('starry-messenger', 4, 'old')",
      );
      const app = await createPersistentApplicationContainer(
        async () => connection.db,
      );
      expect(app.library.positionSec('starry-messenger')).toBe(42);
      expect(app.library.status('starry-messenger')).toBe('want');
      expect(await connection.db.query('SELECT rating FROM ratings')).toEqual([
        {rating: 4},
      ]);
      expect(
        await connection.db.query(
          'SELECT rendition_id FROM listening_progress',
        ),
      ).toEqual([{rendition_id: 'legacy'}]);
    } finally {
      connection.close();
    }
  });

  it('rolls back failed migrations, preserves existing data, and can retry', async () => {
    const connection = open(join(directory, 'rollback.sqlite'));
    try {
      await new MigrationRunner(connection.db, migrations).migrate();
      const bad = {
        version: migrations.length + 1,
        name: 'bad',
        sql: [
          'CREATE TABLE should_rollback (id TEXT)',
          'INSERT INTO missing_table VALUES (1)',
        ],
      };
      await expect(
        new MigrationRunner(connection.db, [...migrations, bad]).migrate(),
      ).rejects.toThrow();
      expect(
        await connection.db.query(
          "SELECT name FROM sqlite_master WHERE name = 'should_rollback'",
        ),
      ).toEqual([]);
      expect(
        await connection.db.query('SELECT version FROM schema_migrations'),
      ).toHaveLength(migrations.length);
      await new MigrationRunner(connection.db, [
        ...migrations,
        {...bad, sql: bad.sql.slice(0, 1)},
      ]).migrate();
      expect(
        await connection.db.query('SELECT version FROM schema_migrations'),
      ).toHaveLength(migrations.length + 1);
    } finally {
      connection.close();
    }
  });

  it('surfaces a failed write without poisoning subsequent queued writes', async () => {
    const connection = open(join(directory, 'errors.sqlite'));
    try {
      const app = await createPersistentApplicationContainer(
        async () => connection.db,
      );
      const save = jest
        .spyOn(app.services.library, 'setPosition')
        .mockRejectedValueOnce(new Error('disk full'));
      app.library.setPosition('starry-messenger', 10);
      await expect(app.library.flush()).rejects.toThrow('disk full');
      app.library.setPosition('starry-messenger', 20);
      await app.library.flush();
      expect(
        await app.repositories.library.get('starry-messenger'),
      ).toMatchObject({positionSec: 20});
      save.mockRestore();
    } finally {
      connection.close();
    }
  });
});
