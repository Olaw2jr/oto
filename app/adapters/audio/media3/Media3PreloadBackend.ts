import type {
  AudioPreloadBackend,
  PreloadHandle,
} from '../../../audio/preload';
import type {AudioTrack} from '../../../audio/types';
import {
  nativeMedia3Bridge,
  type Media3Bridge,
} from './NativeMedia3Bridge';

export class Media3PreloadBackend
  implements AudioPreloadBackend {
  constructor(
    private readonly bridge: Media3Bridge =
      nativeMedia3Bridge,
  ) {}

  async preload(
    track: AudioTrack,
    bufferSec: number,
  ): Promise<PreloadHandle> {
    if (track.source.kind === 'remote') {
      await this.bridge.warmCache(
        track.source.uri,
        track.id,
        bufferSec,
      );
    }
    return {
      trackId: track.id,
      release: async () => {},
    };
  }
}
