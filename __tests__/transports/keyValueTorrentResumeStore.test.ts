import {MemoryKeyValueStorage} from '../../app/storage/memory/MemoryKeyValueStorage';
import {KeyValueTorrentResumeStore} from '../../app/transports/torrent/KeyValueTorrentResumeStore';

describe('KeyValueTorrentResumeStore', () => {
  it('persists opaque resume data by asset id', async () => {
    const storage = new MemoryKeyValueStorage();
    const store = new KeyValueTorrentResumeStore(
      storage.namespace('torrent-resume'),
    );

    await store.save('asset-1', 'opaque-resume-v1');
    await expect(store.load('asset-1')).resolves.toBe('opaque-resume-v1');

    await store.remove('asset-1');
    await expect(store.load('asset-1')).resolves.toBeNull();
  });
});
