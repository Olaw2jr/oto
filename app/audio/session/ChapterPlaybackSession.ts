import type {LibraryService} from '../../services/LibraryService';
import type {AudioEngine} from '../AudioEngine';
import {ChapterPreloadCoordinator} from '../preload';
import type {AudioTrack, PlaybackSnapshot} from '../types';

type ActiveSession = {
  bookId: string;
  renditionId: string;
  tracks: AudioTrack[];
  offsets: number[];
  totalDurationSec: number;
};

const durationOf = (track: AudioTrack): number => {
  const duration = track.durationSec;
  if (duration === undefined || !Number.isFinite(duration) || duration <= 0) {
    throw new Error(
      `Chapter track ${track.id} requires a positive duration for durable progress`,
    );
  }
  return duration;
};

const buildOffsets = (tracks: AudioTrack[]): {
  offsets: number[];
  totalDurationSec: number;
} => {
  const offsets: number[] = [];
  let total = 0;
  for (const track of tracks) {
    offsets.push(total);
    total += durationOf(track);
  }
  return {offsets, totalDurationSec: total};
};

const locateGlobalPosition = (
  tracks: AudioTrack[],
  offsets: number[],
  globalPositionSec: number,
): {index: number; positionSec: number} => {
  const total = offsets[offsets.length - 1] + durationOf(tracks.at(-1)!);
  const clamped = Math.min(total, Math.max(0, globalPositionSec));

  for (let index = tracks.length - 1; index >= 0; index -= 1) {
    if (clamped >= offsets[index]) {
      return {
        index,
        positionSec: Math.min(
          durationOf(tracks[index]),
          clamped - offsets[index],
        ),
      };
    }
  }

  return {index: 0, positionSec: 0};
};

export class ChapterPlaybackSession {
  private active: ActiveSession | null = null;
  private unsubscribe: (() => void) | null = null;
  private checkpointQueue: Promise<void> = Promise.resolve();
  private checkpointError: unknown;
  private hasCheckpointError = false;
  private preloadQueue: Promise<void> = Promise.resolve();
  private preloadError: unknown;
  private hasPreloadError = false;

  constructor(
    private readonly engine: AudioEngine,
    private readonly library: LibraryService,
    private readonly preloader?: ChapterPreloadCoordinator,
  ) {}

  async load(
    bookId: string,
    renditionId: string,
    tracks: AudioTrack[],
  ): Promise<void> {
    if (!tracks.length) {
      throw new Error('Chapter playback queue cannot be empty');
    }
    if (
      tracks.some(
        track =>
          track.bookId !== bookId || track.renditionId !== renditionId,
      )
    ) {
      throw new Error(
        'Chapter playback queue tracks must belong to the same book and rendition',
      );
    }

    const {offsets, totalDurationSec} = buildOffsets(tracks);
    const resumePosition = await this.library.getPosition(
      bookId,
      renditionId,
    );
    const start = locateGlobalPosition(
      tracks,
      offsets,
      resumePosition,
    );

    this.unsubscribe?.();
    this.active = {
      bookId,
      renditionId,
      tracks: [...tracks],
      offsets,
      totalDurationSec,
    };

    await this.engine.load(tracks, {
      startIndex: start.index,
      positionSec: start.positionSec,
    });

    if (this.preloader) {
      await this.preloader.update(tracks, tracks[start.index].id);
    }

    this.unsubscribe = this.engine.subscribe(snapshot => {
      this.queueCheckpoint(snapshot);
      this.queuePreload(snapshot);
    });
  }

  private queueCheckpoint(snapshot: PlaybackSnapshot): void {
    const active = this.active;
    if (!active || !snapshot.trackId) {
      return;
    }

    const index = active.tracks.findIndex(
      track => track.id === snapshot.trackId,
    );
    if (index < 0) {
      return;
    }

    const track = active.tracks[index];
    const chapterPosition = Math.min(
      durationOf(track),
      Math.max(0, snapshot.positionSec),
    );
    const globalPosition = Math.min(
      active.totalDurationSec,
      active.offsets[index] + chapterPosition,
    );

    this.checkpointQueue = this.checkpointQueue
      .then(() =>
        this.library.setPosition(
        active.bookId,
        active.renditionId,
        globalPosition,
        track.chapterId,
        ),
      )
      .catch(error => {
        this.checkpointError = error;
        this.hasCheckpointError = true;
      });
  }

  private queuePreload(snapshot: PlaybackSnapshot): void {
    const active = this.active;
    const preloader = this.preloader;
    if (!active || !preloader || !snapshot.trackId) {
      return;
    }

    this.preloadQueue = this.preloadQueue
      .then(() => preloader.update(active.tracks, snapshot.trackId!))
      .catch(error => {
        this.preloadError = error;
        this.hasPreloadError = true;
      });
  }

  async flush(): Promise<void> {
    await Promise.all([this.checkpointQueue, this.preloadQueue]);
    if (this.hasCheckpointError) {
      const error = this.checkpointError;
      this.checkpointError = undefined;
      this.hasCheckpointError = false;
      throw error;
    }
    if (this.hasPreloadError) {
      const error = this.preloadError;
      this.preloadError = undefined;
      this.hasPreloadError = false;
      throw error;
    }
  }

  async dispose(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    try {
      await this.flush();
    } finally {
      try {
        await this.preloader?.dispose();
      } finally {
        this.active = null;
      }
    }
  }
}
