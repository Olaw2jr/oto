import type {KeyValueStorage} from '../../storage/KeyValueStorage';
import type {PlaybackCacheEntry} from './types';

export class PlaybackCacheIndex {
  constructor(private readonly storage: KeyValueStorage) {}

  async get(assetId: string): Promise<PlaybackCacheEntry | null> {
    const raw = await this.storage.getString(assetId);
    if (!raw) {
      return null;
    }
    try {
      const value = JSON.parse(raw) as PlaybackCacheEntry;
      return value.assetId === assetId &&
        typeof value.uri === 'string' &&
        typeof value.completedAt === 'string'
        ? value
        : null;
    } catch {
      return null;
    }
  }

  async put(entry: PlaybackCacheEntry): Promise<void> {
    await this.storage.setString(entry.assetId, JSON.stringify(entry));
  }

  async remove(assetId: string): Promise<void> {
    await this.storage.remove(assetId);
  }
}
