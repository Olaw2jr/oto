import type {AudioTrack} from '../types';
import type {
  AudioPreloadBackend,
  PreloadHandle,
} from './types';

export class QueueAwarePreloadBackend implements AudioPreloadBackend {
  async preload(
    track: AudioTrack,
    _bufferSec: number,
  ): Promise<PreloadHandle> {
    return {
      trackId: track.id,
      release: async () => {},
    };
  }
}
