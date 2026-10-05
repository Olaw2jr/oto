import type {
  AudioRendition,
  BookId,
  BookWork,
  LibraryStatus,
  RenditionId,
} from '../domain';
import {clampPosition} from '../domain';
import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
  RenditionRepository,
} from '../repositories';

type Dependencies = {
  catalogue: CatalogueRepository;
  renditions: RenditionRepository;
  library: LibraryRepository;
  progress: ProgressRepository;
};

export class LibraryService {
  constructor(private readonly dependencies: Dependencies) {}

  private async requireBook(bookId: BookId): Promise<BookWork> {
    const book = await this.dependencies.catalogue.get(bookId);
    if (!book) {
      throw new Error(`Unknown book: ${bookId}`);
    }
    return book;
  }

  private async requireRendition(
    bookId: BookId,
    renditionId: RenditionId,
  ): Promise<AudioRendition> {
    await this.requireBook(bookId);
    const rendition = await this.dependencies.renditions.get(renditionId);
    if (!rendition) {
      throw new Error(`Unknown audio rendition: ${renditionId}`);
    }
    if (rendition.workId !== bookId) {
      throw new Error(
        `Audio rendition ${renditionId} does not belong to book ${bookId}`,
      );
    }
    return rendition;
  }

  async getStatus(bookId: BookId): Promise<LibraryStatus | undefined> {
    return (await this.dependencies.library.get(bookId))?.status;
  }

  async getPosition(
    bookId: BookId,
    renditionId: RenditionId,
  ): Promise<number> {
    const progress = await this.dependencies.progress.get(bookId, renditionId);
    if (progress) {
      return progress.positionSec;
    }
    return (await this.dependencies.library.get(bookId))?.positionSec ?? 0;
  }

  async getProgress(
    bookId: BookId,
    renditionId: RenditionId,
  ): Promise<number> {
    const rendition = await this.requireRendition(bookId, renditionId);
    const durationSec = rendition.durationSec ?? 0;
    if (durationSec <= 0) {
      return 0;
    }
    return Math.min(
      1,
      (await this.getPosition(bookId, renditionId)) / durationSec,
    );
  }

  async listByStatus(status: LibraryStatus): Promise<BookId[]> {
    return (await this.dependencies.library.list())
      .filter(entry => entry.status === status)
      .map(entry => entry.bookId);
  }

  async setStatus(
    bookId: BookId,
    renditionId: RenditionId,
    status: LibraryStatus,
  ): Promise<void> {
    const rendition = await this.requireRendition(bookId, renditionId);
    const durationSec = rendition.durationSec ?? 0;
    const current = await this.dependencies.library.get(bookId);
    const currentProgress = await this.dependencies.progress.get(
      bookId,
      renditionId,
    );
    const existingPosition =
      currentProgress?.positionSec ?? current?.positionSec ?? 0;
    const positionSec =
      status === 'finished'
        ? durationSec
        : clampPosition(existingPosition, durationSec);

    await this.dependencies.library.save({
      bookId,
      status,
      positionSec,
    });
    await this.dependencies.progress.save({
      bookId,
      renditionId,
      chapterId: currentProgress?.chapterId,
      positionSec,
      durationSec,
    });
  }

  async setPosition(
    bookId: BookId,
    renditionId: RenditionId,
    positionSec: number,
    chapterId?: string,
  ): Promise<void> {
    const rendition = await this.requireRendition(bookId, renditionId);
    const durationSec = rendition.durationSec ?? 0;
    const current = await this.dependencies.library.get(bookId);
    const nextPosition = clampPosition(positionSec, durationSec);

    await this.dependencies.library.save({
      bookId,
      status: current?.status ?? 'listening',
      positionSec: nextPosition,
    });
    await this.dependencies.progress.save({
      bookId,
      renditionId,
      chapterId,
      positionSec: nextPosition,
      durationSec,
    });
  }

  async advance(
    bookId: BookId,
    renditionId: RenditionId,
    deltaSec: number,
  ): Promise<void> {
    const currentPosition = await this.getPosition(bookId, renditionId);
    await this.setPosition(
      bookId,
      renditionId,
      currentPosition + deltaSec,
    );
  }
}
