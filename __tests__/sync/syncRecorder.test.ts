import {InMemoryMutationOutbox} from '../../app/sync';
import {bookEntityId, editionEntityId} from '../../app/sync/ids';
import {SyncRecorder} from '../../app/sync/SyncRecorder';

const SHELF = '0b5e3e0e-3d1f-4c33-9a43-7f8a2b6c1d22';

function setup() {
  const outbox = new InMemoryMutationOutbox();
  let clock = new Date('2026-10-01T12:00:00Z').getTime();
  let n = 0;
  const recorder = new SyncRecorder({
    outbox,
    now: () => new Date(clock),
    newId: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
  });
  const queued = async () => (await outbox.listReady(new Date(8.64e15)));
  return {recorder, queued, tick: (sec: number) => (clock += sec * 1000)};
}

describe('SyncRecorder', () => {
  it('records library status with server book ids', async () => {
    const {recorder, queued} = setup();
    await recorder.libraryStatus('greenlights', 'want');

    expect(await queued()).toEqual([
      expect.objectContaining({
        id: '00000000-0000-4000-8000-000000000001',
        kind: 'library.status',
        entityId: bookEntityId('greenlights'),
        payload: {status: 'want'},
        createdAt: '2026-10-01T12:00:00.000Z',
      }),
    ]);
  });

  it('throttles steady listening but records seeks back at once', async () => {
    const {recorder, queued, tick} = setup();
    await recorder.progress('greenlights', 100);
    tick(5);
    await recorder.progress('greenlights', 105);
    tick(5);
    await recorder.progress('greenlights', 110);
    // Rewinding is a seek, so it can move the server's position back.
    await recorder.progress('greenlights', 40);
    tick(30);
    await recorder.progress('greenlights', 75);

    expect((await queued()).map(m => [m.entityId, m.payload])).toEqual([
      [editionEntityId('greenlights'), {position_sec: 100}],
      [editionEntityId('greenlights'), {position_sec: 40, seek: true}],
      [editionEntityId('greenlights'), {position_sec: 75}],
    ]);
  });

  it('skips a starting position of zero but records a restart', async () => {
    const {recorder, queued, tick} = setup();
    await recorder.progress('greenlights', 0);
    await recorder.progress('greenlights', 50);
    tick(1);
    await recorder.progress('greenlights', 0);

    expect((await queued()).map(m => m.payload)).toEqual([
      {position_sec: 50},
      {position_sec: 0, seek: true},
    ]);
  });

  it('settles positions the throttle held back', async () => {
    const {recorder, queued, tick} = setup();
    await recorder.progress('greenlights', 100);
    tick(5);
    await recorder.progress('greenlights', 104.6);
    await recorder.settle();
    await recorder.settle();

    expect((await queued()).map(m => m.payload)).toEqual([
      {position_sec: 100},
      {position_sec: 104},
    ]);
  });

  it('records shelves, deletions and ratings', async () => {
    const {recorder, queued} = setup();
    await recorder.shelf({id: SHELF, name: 'Road trips', bookIds: ['greenlights']});
    await recorder.shelfDeleted(SHELF);
    await recorder.rating('greenlights', 4);
    await recorder.rating('greenlights', null);

    expect((await queued()).map(m => [m.kind, m.entityId, m.payload])).toEqual([
      ['shelf.upsert', SHELF, {name: 'Road trips', book_ids: [bookEntityId('greenlights')]}],
      ['shelf.upsert', SHELF, {deleted: true}],
      ['rating.set', bookEntityId('greenlights'), {rating: 4}],
      ['rating.set', bookEntityId('greenlights'), {rating: null}],
    ]);
  });

  it('skips shelves from before ids were UUIDs', async () => {
    const {recorder, queued} = setup();
    await recorder.shelf({id: 'road-trips', name: 'Road trips', bookIds: []});
    await recorder.shelfDeleted('road-trips');
    expect(await queued()).toEqual([]);
  });
});
