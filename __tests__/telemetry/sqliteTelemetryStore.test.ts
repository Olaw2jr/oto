import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {MigrationRunner, migrations, SqliteTelemetryStore} from '../../app/storage/sqlite';
import {openNodeSqlite} from '../storage/sqlite-test-utils';

describe('SqliteTelemetryStore', () => {
  let directory: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'oto-telemetry-'));
  });
  afterEach(() => rmSync(directory, {recursive: true, force: true}));

  it('keeps the newest events across a restart and removes sent ones', async () => {
    const filename = join(directory, 'oto.sqlite');
    const first = openNodeSqlite(filename);
    await new MigrationRunner(first.db, migrations).migrate();
    const store = new SqliteTelemetryStore(first.db, 2);
    for (const name of ['a', 'b', 'c']) {
      await store.add({kind: 'event', name, at: '2026-10-09T12:00:00.000Z', props: {}});
    }
    first.close();

    const second = openNodeSqlite(filename);
    try {
      const reopened = new SqliteTelemetryStore(second.db, 2);
      const queued = await reopened.oldest(10);
      expect(queued.map(e => e.event.name)).toEqual(['b', 'c']);
      await reopened.remove([queued[0].id]);
      expect((await reopened.oldest(10)).map(e => e.event.name)).toEqual(['c']);
    } finally {
      second.close();
    }
  });
});
