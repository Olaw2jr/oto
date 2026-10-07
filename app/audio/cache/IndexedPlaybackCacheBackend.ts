import type {LocalMediaSource} from '../../domain';
import type {
  PlaybackCacheBackend,
  PlaybackCacheEntry,
} from './types';
import {PlaybackCacheIndex} from './PlaybackCacheIndex';

export interface PhysicalPlaybackCache {
  warm(
    assetId: string,
    uri: string,
    sizeBytes?: number,
  ): Promise<PlaybackCacheEntry | null>;
  evict(assetId: string): Promise<void>;
}

export class IndexedPlaybackCacheBackend implements PlaybackCacheBackend {
  constructor(
    private readonly index: PlaybackCacheIndex,
    private readonly physical: PhysicalPlaybackCache,
  ) {}

  async locate(assetId: string): Promise<LocalMediaSource | null> {
    const entry = await this.index.get(assetId);
    return entry ? {kind: 'local', uri: entry.uri} : null;
  }

  async warm(
    assetId: string,
    uri: string,
    sizeBytes?: number,
  ): Promise<void> {
    const entry = await this.physical.warm(assetId, uri, sizeBytes);
    if (entry) {
      await this.index.put(entry);
    }
  }

  async evict(assetId: string): Promise<void> {
    await this.physical.evict(assetId);
    await this.index.remove(assetId);
  }
}
