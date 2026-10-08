import {SourceResolver} from '../audio/SourceResolver';
import type {AudioSource, AudioTrack} from '../audio/types';
import type {
  AudioChapter,
  BookId,
  MediaAsset,
  MediaFormat,
} from '../domain';
import type {
  CatalogueRepository,
  RenditionRepository,
} from '../repositories';

export type PlaybackAssetBinding = {
  chapterId: string;
  asset: MediaAsset;
};

export interface PlaybackAssetRepository {
  listForRendition(
    renditionId: string,
  ): Promise<PlaybackAssetBinding[]>;
}

export type ResolvedPlaybackQueue = {
  bookId: BookId;
  renditionId: string;
  tracks: AudioTrack[];
  dispose(): Promise<void>;
};

const MIME_TYPES: Partial<Record<MediaFormat, string>> = {
  mp3: 'audio/mpeg',
  m4b: 'audio/mp4',
  aac: 'audio/aac',
  opus: 'audio/opus',
};

const chapterDuration = (
  chapters: AudioChapter[],
  index: number,
  renditionDurationSec?: number,
): number => {
  const chapter = chapters[index];
  const explicit = chapter.durationSec;
  if (explicit !== undefined && Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }

  const next = chapters[index + 1];
  const inferred = next
    ? next.startSec - chapter.startSec
    : renditionDurationSec === undefined
    ? undefined
    : renditionDurationSec - chapter.startSec;

  if (inferred === undefined || !Number.isFinite(inferred) || inferred <= 0) {
    throw new Error(
      `Chapter ${chapter.id} requires a positive duration for playback`,
    );
  }
  return inferred;
};

const toAudioSource = (
  asset: MediaAsset,
  uri: string,
  transport: 'https' | 'local' | 'torrent',
): AudioSource => {
  const mimeType = MIME_TYPES[asset.format];
  return {
    kind: transport === 'local' ? 'local' : 'remote',
    uri,
    ...(mimeType ? {mimeType} : {}),
  };
};

export class PlaybackQueueResolver {
  constructor(
    private readonly catalogue: CatalogueRepository,
    private readonly renditions: RenditionRepository,
    private readonly assets: PlaybackAssetRepository,
    private readonly sources: SourceResolver,
  ) {}

  async resolve(bookId: BookId): Promise<ResolvedPlaybackQueue> {
    const work = await this.catalogue.get(bookId);
    if (!work) {
      throw new Error(`Unknown book: ${bookId}`);
    }

    const candidates = await this.renditions.listForWork(bookId);
    const rendition = candidates.find(
      candidate =>
        candidate.chapters.length > 0 &&
        candidate.rights.status !== 'unknown',
    );
    if (!rendition) {
      throw new Error(
        `No authorized audio rendition is available for book ${bookId}`,
      );
    }

    const bindings = await this.assets.listForRendition(rendition.id);
    const byChapter = new Map(
      bindings
        .filter(binding => binding.asset.renditionId === rendition.id)
        .map(binding => [binding.chapterId, binding.asset] as const),
    );
    const prepared: Array<{
      cleanup?: () => Promise<void>;
    }> = [];

    try {
      const tracks: AudioTrack[] = [];
      for (let index = 0; index < rendition.chapters.length; index += 1) {
        const chapter = rendition.chapters[index];
        const asset = byChapter.get(chapter.id);
        if (!asset) {
          throw new Error(
            `Missing media asset for chapter ${chapter.id}`,
          );
        }

        const durationSec = chapterDuration(
          rendition.chapters,
          index,
          rendition.durationSec,
        );
        const playable = await this.sources.resolve(
          asset,
          rendition.rights,
          {
            durationSec,
            positionSec: 0,
          },
        );
        prepared.push(playable);

        tracks.push({
          id: `${rendition.id}:${chapter.id}`,
          bookId,
          renditionId: rendition.id,
          chapterId: chapter.id,
          title: chapter.title,
          artist: rendition.narrators.map(reader => reader.name).join(', ') || undefined,
          album: work.title,
          description: work.description,
          durationSec,
          source: toAudioSource(asset, playable.uri, playable.transport),
        });
      }

      return {
        bookId,
        renditionId: rendition.id,
        tracks,
        dispose: async () => {
          for (const playable of [...prepared].reverse()) {
            await playable.cleanup?.();
          }
        },
      };
    } catch (error) {
      for (const playable of [...prepared].reverse()) {
        try {
          await playable.cleanup?.();
        } catch {
          // Keep the original resolution failure.
        }
      }
      throw error;
    }
  }
}
