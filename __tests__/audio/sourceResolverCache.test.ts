import type {
  LocalMediaSource,
  MediaAsset,
  RightsInfo,
} from '../../app/domain';
import {RightsPolicy} from '../../app/domain/rights';
import {
  PlaybackCache,
  type PlaybackCacheBackend,
} from '../../app/audio/cache';
import {SourceResolver} from '../../app/audio/SourceResolver';
import {
  FakeContentTransport,
  TransportRegistry,
} from '../../app/transports';

const rights: RightsInfo = {
  status: 'public-domain',
  source: 'test',
  verifiedAt: '2026-10-06T00:00:00Z',
};

const asset: MediaAsset = {
  id: 'asset-1',
  renditionId: 'rendition-1',
  format: 'm4b',
  sizeBytes: 1000,
  sources: [
    {
      kind: 'https',
      uri: 'https://cdn.example.test/book.m4b',
      trustedSourceId: 'archive',
    },
  ],
};

class FakeCacheBackend implements PlaybackCacheBackend {
  cached: LocalMediaSource | null = null;
  warms: Array<{assetId: string; uri: string; sizeBytes?: number}> = [];
  evictions: string[] = [];

  async locate(): Promise<LocalMediaSource | null> {
    return this.cached;
  }

  async warm(
    assetId: string,
    uri: string,
    sizeBytes?: number,
  ): Promise<void> {
    this.warms.push({assetId, uri, sizeBytes});
  }

  async evict(assetId: string): Promise<void> {
    this.evictions.push(assetId);
  }
}

describe('SourceResolver playback cache integration', () => {
  it('uses a complete cached local copy before network sources', async () => {
    const backend = new FakeCacheBackend();
    backend.cached = {
      kind: 'local',
      uri: 'file:///cache/asset-1.m4b',
    };
    const cache = new PlaybackCache(backend);
    const local = new FakeContentTransport('local');
    const https = new FakeContentTransport('https');
    const resolver = new SourceResolver(
      new TransportRegistry([local, https]),
      new RightsPolicy('TZ', ['archive']),
      cache,
      cache,
    );

    const playable = await resolver.resolve(asset, rights);

    expect(playable.transport).toBe('local');
    expect(playable.uri).toBe('file:///cache/asset-1.m4b');
    expect(backend.warms).toHaveLength(0);
  });

  it('warms authorized remote playback without blocking resolution policy', async () => {
    const backend = new FakeCacheBackend();
    const cache = new PlaybackCache(backend);
    const https = new FakeContentTransport('https');
    const resolver = new SourceResolver(
      new TransportRegistry([https]),
      new RightsPolicy('TZ', ['archive']),
      cache,
      cache,
    );

    const playable = await resolver.resolve(asset, rights);
    await cache.flush();

    expect(playable.transport).toBe('https');
    expect(backend.warms).toEqual([
      {
        assetId: 'asset-1',
        uri: 'https://cdn.example.test/book.m4b',
        sizeBytes: 1000,
      },
    ]);
  });

  it('never warms a source denied by rights policy', async () => {
    const backend = new FakeCacheBackend();
    const cache = new PlaybackCache(backend);
    const https = new FakeContentTransport('https');
    const resolver = new SourceResolver(
      new TransportRegistry([https]),
      new RightsPolicy('TZ', []),
      cache,
      cache,
    );

    await expect(resolver.resolve(asset, rights)).rejects.toThrow(
      'No authorized media source is playable',
    );
    await cache.flush();

    expect(backend.warms).toHaveLength(0);
  });

  it('deduplicates concurrent warm requests per asset', async () => {
    const backend = new FakeCacheBackend();
    const cache = new PlaybackCache(backend);

    cache.warm('asset-1', {
      uri: 'https://cdn.example.test/book.m4b',
      transport: 'https',
    }, 1000);
    cache.warm('asset-1', {
      uri: 'https://cdn.example.test/book.m4b',
      transport: 'https',
    }, 1000);
    await cache.flush();

    expect(backend.warms).toHaveLength(1);
  });
});
