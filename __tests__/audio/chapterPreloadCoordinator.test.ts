import type {AudioTrack} from '../../app/audio';
import {
  ChapterPreloadCoordinator,
  type AudioPreloadBackend,
  type PreloadHandle,
} from '../../app/audio/preload';

const tracks: AudioTrack[] = Array.from({length: 4}, (_, index) => ({
  id: `track-${index + 1}`,
  bookId: 'book-1',
  renditionId: 'rendition-1',
  chapterId: `chapter-${index + 1}`,
  title: `Chapter ${index + 1}`,
  durationSec: 300,
  source: {
    kind: 'remote',
    uri: `https://example.test/${index + 1}.m4a`,
  },
}));

class FakeBackend implements AudioPreloadBackend {
  requested: Array<{trackId: string; bufferSec: number}> = [];
  released: string[] = [];

  async preload(
    track: AudioTrack,
    bufferSec: number,
  ): Promise<PreloadHandle> {
    this.requested.push({trackId: track.id, bufferSec});
    return {
      trackId: track.id,
      release: async () => {
        this.released.push(track.id);
      },
    };
  }
}

describe('ChapterPreloadCoordinator', () => {
  it('warms the current and next chapter with different budgets', async () => {
    const backend = new FakeBackend();
    const coordinator = new ChapterPreloadCoordinator(backend, {
      currentBufferSec: 30,
      nextBufferSec: 15,
      chaptersAhead: 1,
    });

    await coordinator.update(tracks, 'track-2');

    expect(backend.requested).toEqual([
      {trackId: 'track-2', bufferSec: 30},
      {trackId: 'track-3', bufferSec: 15},
    ]);
  });

  it('releases stale preloads when playback advances', async () => {
    const backend = new FakeBackend();
    const coordinator = new ChapterPreloadCoordinator(backend, {
      currentBufferSec: 30,
      nextBufferSec: 15,
      chaptersAhead: 1,
    });

    await coordinator.update(tracks, 'track-1');
    await coordinator.update(tracks, 'track-2');

    expect(backend.released).toContain('track-1');
    expect(backend.requested.map(x => x.trackId)).toEqual([
      'track-1',
      'track-2',
      'track-3',
    ]);
  });

  it('releases every preload on dispose', async () => {
    const backend = new FakeBackend();
    const coordinator = new ChapterPreloadCoordinator(backend);

    await coordinator.update(tracks, 'track-1');
    await coordinator.dispose();

    expect(new Set(backend.released)).toEqual(
      new Set(['track-1', 'track-2']),
    );
  });

  it('rejects an unknown active track', async () => {
    const backend = new FakeBackend();
    const coordinator = new ChapterPreloadCoordinator(backend);

    await expect(
      coordinator.update(tracks, 'missing'),
    ).rejects.toThrow('Unknown active preload track: missing');
  });
});
