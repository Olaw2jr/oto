import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPersistentApplicationContainer} from '../../app/composition/ApplicationContainer';
import {bookEntityId} from '../../app/sync/ids';
import {openNodeSqlite as open} from './sqlite-test-utils';

const SHELF = '0b5e3e0e-3d1f-4c33-9a43-7f8a2b6c1d22';
const everything = new Date(8.64e15);

describe('recording changes for oto-api', () => {
  let directory: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'oto-sync-'));
  });
  afterEach(() => {
    rmSync(directory, {recursive: true, force: true});
  });

  it('queues library, shelf and rating changes once a backend is configured', async () => {
    const database = open(join(directory, 'oto.sqlite'));
    try {
      const app = await createPersistentApplicationContainer(async () => database.db, {
        apiBaseUrl: 'https://api.oto.test',
      });
      app.library.setStatus('starry-messenger', 'want');
      await app.library.flush();
      await app.collections.repository.saveShelf({id: SHELF, name: 'Road trips', bookIds: []});
      await app.collections.repository.saveRating('starry-messenger', 4);

      const queued = await app.sync.outbox.listReady(everything);
      expect(queued.map(m => [m.kind, m.entityId])).toEqual([
        ['library.status', bookEntityId('starry-messenger')],
        ['shelf.upsert', SHELF],
        ['rating.set', bookEntityId('starry-messenger')],
      ]);
    } finally {
      database.close();
    }
  });

  it('records nothing while no backend is configured', async () => {
    const database = open(join(directory, 'oto.sqlite'));
    try {
      const app = await createPersistentApplicationContainer(async () => database.db, {
        apiBaseUrl: null,
      });
      app.library.setStatus('starry-messenger', 'want');
      await app.library.flush();
      await app.collections.repository.saveRating('starry-messenger', 4);

      expect(await app.sync.outbox.listReady(everything)).toEqual([]);
      expect(app.sync.recorder).toBeUndefined();
    } finally {
      database.close();
    }
  });
});
