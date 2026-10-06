import type {LocalMediaSource} from '../../domain';
import type {PlayableSource} from '../../transports';
import type {
  PlaybackCacheBackend,
  PlaybackCacheController,
} from './types';

export class PlaybackCache implements PlaybackCacheController {
  private pending = Promise.resolve();
  private readonly warming = new Set<string>();

  constructor(private readonly backend: PlaybackCacheBackend) {}

  locate(assetId: string): Promise<LocalMediaSource | null> {
    return this.backend.locate(assetId);
  }

  warm(
    assetId: string,
    playable: PlayableSource,
    sizeBytes?: number,
  ): void {
    if (playable.transport === 'local' || this.warming.has(assetId)) {
      return;
    }

    this.warming.add(assetId);
    this.pending = this.pending
      .then(() => this.backend.warm(assetId, playable.uri, sizeBytes))
      .finally(() => {
        this.warming.delete(assetId);
      });
  }

  async evict(assetId: string): Promise<void> {
    await this.backend.evict(assetId);
  }

  async flush(): Promise<void> {
    await this.pending;
  }
}
