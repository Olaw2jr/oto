import type {
  PhysicalPlaybackCache,
  PlaybackCacheEntry,
} from '../../../audio/cache';
import {
  nativeMedia3Bridge,
  type Media3Bridge,
} from './NativeMedia3Bridge';

export class Media3PhysicalPlaybackCache
  implements PhysicalPlaybackCache {
  constructor(
    private readonly bridge: Media3Bridge =
      nativeMedia3Bridge,
  ) {}

  async warm(
    assetId: string,
    uri: string,
    _sizeBytes?: number,
  ): Promise<PlaybackCacheEntry | null> {
    await this.bridge.warmCache(uri, assetId, 30);
    return null;
  }

  async evict(assetId: string): Promise<void> {
    await this.bridge.evictCache(assetId);
  }
}
