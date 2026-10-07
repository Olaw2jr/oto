import {MemoryKeyValueStorage} from '../../app/storage/memory/MemoryKeyValueStorage';
import {
  PlaybackCacheIndex,
} from '../../app/audio/cache';

describe('PlaybackCacheIndex', () => {
  it('persists complete local cache entries by asset id', async () => {
    const storage = new MemoryKeyValueStorage();
    const index = new PlaybackCacheIndex(storage.namespace('media-cache'));

    await index.put({
      assetId: 'asset-1',
      uri: 'file:///cache/asset-1.m4b',
      sizeBytes: 1234,
      completedAt: '2026-10-06T00:00:00Z',
    });

    await expect(index.get('asset-1')).resolves.toEqual({
      assetId: 'asset-1',
      uri: 'file:///cache/asset-1.m4b',
      sizeBytes: 1234,
      completedAt: '2026-10-06T00:00:00Z',
    });

    await index.remove('asset-1');
    await expect(index.get('asset-1')).resolves.toBeNull();
  });
});
