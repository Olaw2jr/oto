import type {AudioTrack} from '../types';
import type {
  AudioPreloadBackend,
  ChapterPreloadPolicy,
  PreloadHandle,
} from './types';

const defaults: ChapterPreloadPolicy = {
  currentBufferSec: 30,
  nextBufferSec: 15,
  chaptersAhead: 1,
};

const validate = (
  policy: ChapterPreloadPolicy,
): ChapterPreloadPolicy => {
  if (
    policy.currentBufferSec <= 0 ||
    policy.nextBufferSec <= 0 ||
    policy.chaptersAhead < 0 ||
    !Number.isInteger(policy.chaptersAhead)
  ) {
    throw new Error('Invalid chapter preload policy');
  }
  return {...policy};
};

export class ChapterPreloadCoordinator {
  private readonly policy: ChapterPreloadPolicy;
  private readonly handles = new Map<string, PreloadHandle>();

  constructor(
    private readonly backend: AudioPreloadBackend,
    policy: ChapterPreloadPolicy = defaults,
  ) {
    this.policy = validate(policy);
  }

  async update(
    tracks: AudioTrack[],
    activeTrackId: string,
  ): Promise<void> {
    const activeIndex = tracks.findIndex(
      track => track.id === activeTrackId,
    );
    if (activeIndex < 0) {
      throw new Error(
        `Unknown active preload track: ${activeTrackId}`,
      );
    }

    const desired = new Map<string, number>();
    desired.set(activeTrackId, this.policy.currentBufferSec);

    for (
      let offset = 1;
      offset <= this.policy.chaptersAhead;
      offset += 1
    ) {
      const track = tracks[activeIndex + offset];
      if (track) {
        desired.set(track.id, this.policy.nextBufferSec);
      }
    }

    for (const [trackId, handle] of [...this.handles]) {
      if (!desired.has(trackId)) {
        await handle.release();
        this.handles.delete(trackId);
      }
    }

    for (const [trackId, bufferSec] of desired) {
      if (this.handles.has(trackId)) {
        continue;
      }
      const track = tracks.find(item => item.id === trackId);
      if (!track) {
        continue;
      }
      this.handles.set(
        trackId,
        await this.backend.preload(track, bufferSec),
      );
    }
  }

  async dispose(): Promise<void> {
    for (const handle of this.handles.values()) {
      await handle.release();
    }
    this.handles.clear();
  }
}
