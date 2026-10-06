import type {LocalMediaSource} from '../../domain';
import type {PlayableSource} from '../../transports';

export interface PlaybackCacheBackend {
  locate(assetId: string): Promise<LocalMediaSource | null>;
  warm(
    assetId: string,
    uri: string,
    sizeBytes?: number,
  ): Promise<void>;
  evict(assetId: string): Promise<void>;
}

export type PlaybackCacheEntry = {
  assetId: string;
  uri: string;
  sizeBytes?: number;
  completedAt: string;
};

export interface PlaybackCacheController {
  locate(assetId: string): Promise<LocalMediaSource | null>;
  warm(
    assetId: string,
    playable: PlayableSource,
    sizeBytes?: number,
  ): void;
  evict(assetId: string): Promise<void>;
  flush(): Promise<void>;
}
