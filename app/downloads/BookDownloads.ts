import type {DownloadedAssetLocator} from '../audio/SourceResolver';
import type {HttpsMediaSource} from '../domain';
import type {RightsPolicy} from '../domain/rights';
import type {PlaybackAssetRepository} from '../player/PlaybackQueueResolver';
import type {RenditionRepository} from '../repositories';
import type {BookDownloadStatus, DownloadEngine, DownloadState} from './types';

export class DownloadUnavailableError extends Error {
  constructor() {
    super('This book has no audio that can be downloaded');
    this.name = 'DownloadUnavailableError';
  }
}

type Dependencies = {
  engine: DownloadEngine;
  renditions: Pick<RenditionRepository, 'listForWork'>;
  assets: PlaybackAssetRepository;
  rightsPolicy: RightsPolicy;
};

// Downloads whole books, one platform download per chapter, from the
// chapter's rights-cleared HTTPS source.
export class BookDownloads {
  constructor(private readonly deps: Dependencies) {}

  // Whether the book has rights-cleared audio that could be downloaded.
  async canDownload(bookId: string): Promise<boolean> {
    return (await this.deps.renditions.listForWork(bookId)).some(
      rendition => rendition.chapters.length > 0 && rendition.rights.status !== 'unknown',
    );
  }

  // Books with at least one download, in the order they were started.
  async bookIds(): Promise<string[]> {
    return [...new Set((await this.deps.engine.list()).map(s => s.bookId))];
  }

  async downloadBook(bookId: string, {wifiOnly}: {wifiOnly: boolean}): Promise<number> {
    const {engine, renditions, assets, rightsPolicy} = this.deps;
    const rendition = (await renditions.listForWork(bookId)).find(
      candidate => candidate.chapters.length > 0 && candidate.rights.status !== 'unknown',
    );
    if (!rendition) throw new DownloadUnavailableError();

    const bindings = await assets.listForRendition(rendition.id);
    const requests = rendition.chapters.flatMap(chapter => {
      const asset = bindings.find(b => b.chapterId === chapter.id)?.asset;
      const source = asset?.sources.find(
        (candidate): candidate is HttpsMediaSource =>
          candidate.kind === 'https' &&
          rightsPolicy.evaluate(rendition.rights, candidate).allowed,
      );
      return asset && source
        ? [{
            id: asset.id,
            bookId,
            uri: source.uri,
            cacheKey: `${rendition.id}:${chapter.id}`,
            title: chapter.title,
            trustedSourceId: source.trustedSourceId,
            sizeBytes: asset.sizeBytes,
            wifiOnly,
          }]
        : [];
    });
    if (requests.length !== rendition.chapters.length) {
      throw new DownloadUnavailableError();
    }
    for (const request of requests) {
      await engine.start(request);
    }
    return requests.length;
  }

  async removeBook(bookId: string): Promise<void> {
    for (const status of await this.deps.engine.list()) {
      if (status.bookId === bookId) await this.deps.engine.remove(status.id);
    }
  }

  setWifiOnly(wifiOnly: boolean): Promise<void> {
    return this.deps.engine.setWifiOnly(wifiOnly);
  }

  async bookStatus(bookId: string): Promise<BookDownloadStatus> {
    const chapters = (await this.deps.engine.list()).filter(s => s.bookId === bookId);
    if (!chapters.length) {
      return {state: 'none', chaptersDone: 0, chapters: 0, bytesDownloaded: 0, totalBytes: 0};
    }
    const states = new Set(chapters.map(c => c.state));
    const state: DownloadState = states.has('failed')
      ? 'failed'
      : states.size === 1 && states.has('completed')
      ? 'completed'
      : states.has('downloading')
      ? 'downloading'
      : states.has('paused')
      ? 'paused'
      : 'queued';
    return {
      state,
      chaptersDone: chapters.filter(c => c.state === 'completed').length,
      chapters: chapters.length,
      bytesDownloaded: chapters.reduce((sum, c) => sum + c.bytesDownloaded, 0),
      totalBytes: chapters.reduce((sum, c) => sum + (c.totalBytes ?? 0), 0),
    };
  }

  subscribe(listener: () => void): () => void {
    return this.deps.engine.subscribe(() => listener());
  }
}

// Lets playback prefer a completed download over streaming.
export const createDownloadedAssetLocator = (
  engine: DownloadEngine,
): DownloadedAssetLocator => ({
  locate: assetId => engine.playbackSource(assetId),
});
