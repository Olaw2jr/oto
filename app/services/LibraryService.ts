import type {
  Book,
  BookId,
  LibraryStatus,
} from '../domain';
import {clampPosition} from '../domain';
import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
} from '../repositories';

type Dependencies = {
  catalogue: CatalogueRepository;
  library: LibraryRepository;
  progress: ProgressRepository;
};

export class LibraryService {
  constructor(private readonly dependencies: Dependencies) {}

  private async requireBook(bookId: BookId): Promise<Book> {
    const book = await this.dependencies.catalogue.get(bookId);
    if (!book) {
      throw new Error(`Unknown book: ${bookId}`);
    }
    return book;
  }

  async getStatus(bookId: BookId): Promise<LibraryStatus | undefined> {
    return (await this.dependencies.library.get(bookId))?.status;
  }

  async getPosition(bookId: BookId): Promise<number> {
    const progress = await this.dependencies.progress.get(bookId);
    if (progress) {
      return progress.positionSec;
    }
    return (await this.dependencies.library.get(bookId))?.positionSec ?? 0;
  }

  async getProgress(bookId: BookId): Promise<number> {
    const book = await this.requireBook(bookId);
    if (book.durationSec <= 0) {
      return 0;
    }
    return Math.min(1, (await this.getPosition(bookId)) / book.durationSec);
  }

  async listByStatus(status: LibraryStatus): Promise<BookId[]> {
    return (await this.dependencies.library.list())
      .filter(entry => entry.status === status)
      .map(entry => entry.bookId);
  }

  async setStatus(bookId: BookId, status: LibraryStatus): Promise<void> {
    const book = await this.requireBook(bookId);
    const current = await this.dependencies.library.get(bookId);
    const currentProgress = await this.dependencies.progress.get(bookId);
    const existingPosition =
      currentProgress?.positionSec ?? current?.positionSec ?? 0;
    const positionSec =
      status === 'finished'
        ? book.durationSec
        : clampPosition(existingPosition, book.durationSec);

    await this.dependencies.library.save({
      bookId,
      status,
      positionSec,
    });
    await this.dependencies.progress.save({
      bookId,
      positionSec,
      durationSec: book.durationSec,
    });
  }

  async setPosition(bookId: BookId, positionSec: number): Promise<void> {
    const book = await this.requireBook(bookId);
    const current = await this.dependencies.library.get(bookId);
    const nextPosition = clampPosition(positionSec, book.durationSec);

    await this.dependencies.library.save({
      bookId,
      status: current?.status ?? 'listening',
      positionSec: nextPosition,
    });
    await this.dependencies.progress.save({
      bookId,
      positionSec: nextPosition,
      durationSec: book.durationSec,
    });
  }

  async advance(bookId: BookId, deltaSec: number): Promise<void> {
    const currentPosition = await this.getPosition(bookId);
    await this.setPosition(bookId, currentPosition + deltaSec);
  }
}
