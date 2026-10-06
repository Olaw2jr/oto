import type {
  BookId,
  LibraryStatus,
  RenditionId,
} from '../../domain';
import {clampPosition} from '../../domain';
import {getBook} from '../../data/catalogue';
import {librarySeed} from '../../data/social';
import {LibraryService} from '../../services/LibraryService';
import {
  SeedCatalogueRepository,
  SeedRenditionRepository,
  seedRenditionId,
} from '../catalogue/SeedCatalogueRepositories';
import {
  ObservableLibraryRepository,
  ObservableProgressRepository,
} from './ObservableLibraryRepository';

type Listener = () => void;

export type LibraryProviderAdapter = {
  subscribe(listener: Listener): () => void;
  getSnapshot(): number;
  status(bookId: BookId): LibraryStatus | undefined;
  positionSec(bookId: BookId): number;
  progress(bookId: BookId): number;
  byStatus(status: LibraryStatus): BookId[];
  renditionId(bookId: BookId): RenditionId;
  setStatus(bookId: BookId, status: LibraryStatus): void;
  setPosition(bookId: BookId, positionSec: number): void;
  advance(bookId: BookId, deltaSec: number, limitSec?: number): void;
  flush(): Promise<void>;
};

export class ServiceLibraryProviderAdapter implements LibraryProviderAdapter {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly service: LibraryService,
    private readonly library: ObservableLibraryRepository,
    private readonly progressRepository: ObservableProgressRepository,
    private readonly renditionFor: (bookId: BookId) => RenditionId,
    private readonly durationFor: (bookId: BookId) => number,
  ) {}

  subscribe = (listener: Listener): (() => void) =>
    this.library.subscribe(listener);

  getSnapshot = (): number => this.library.getSnapshot();

  status = (bookId: BookId): LibraryStatus | undefined =>
    this.library.peek(bookId)?.status;

  positionSec = (bookId: BookId): number =>
    this.library.peek(bookId)?.positionSec ?? 0;

  progress = (bookId: BookId): number => {
    const durationSec = this.durationFor(bookId);
    return durationSec <= 0
      ? 0
      : Math.min(1, this.positionSec(bookId) / durationSec);
  };

  byStatus = (status: LibraryStatus): BookId[] =>
    this.library
      .listSync()
      .filter(entry => entry.status === status)
      .map(entry => entry.bookId);

  renditionId = (bookId: BookId): RenditionId =>
    this.renditionFor(bookId);

  private enqueue(work: () => Promise<void>): void {
    this.queue = this.queue.then(work);
  }

  setStatus = (bookId: BookId, status: LibraryStatus): void => {
    const renditionId = this.renditionFor(bookId);
    const durationSec = this.durationFor(bookId);
    const current = this.library.peek(bookId);
    const positionSec =
      status === 'finished'
        ? durationSec
        : clampPosition(current?.positionSec ?? 0, durationSec);

    this.library.setOptimistic({bookId, status, positionSec});
    this.progressRepository.setOptimistic({
      bookId,
      renditionId,
      positionSec,
      durationSec,
    });

    this.enqueue(() =>
      this.service.setStatus(bookId, renditionId, status),
    );
  };

  setPosition = (bookId: BookId, positionSec: number): void => {
    const renditionId = this.renditionFor(bookId);
    const durationSec = this.durationFor(bookId);
    const nextPosition = clampPosition(positionSec, durationSec);

    this.library.setOptimistic({
      bookId,
      status: statusAfterPosition(this.status(bookId)),
      positionSec: nextPosition,
    });
    this.progressRepository.setOptimistic({
      bookId,
      renditionId,
      positionSec: nextPosition,
      durationSec,
    });

    this.enqueue(() =>
      this.service.setPosition(bookId, renditionId, nextPosition),
    );
  };

  advance = (
    bookId: BookId,
    deltaSec: number,
    limitSec?: number,
  ): void => {
    const upperBound = Math.min(
      this.durationFor(bookId),
      limitSec ?? Number.POSITIVE_INFINITY,
    );
    const nextPosition = Math.min(
      upperBound,
      Math.max(0, this.positionSec(bookId) + deltaSec),
    );
    this.setPosition(bookId, nextPosition);
  };

  flush = async (): Promise<void> => {
    await this.queue;
  };
}

export const createSeedLibraryProviderAdapter =
  (): ServiceLibraryProviderAdapter => {
    const catalogue = new SeedCatalogueRepository();
    const renditions = new SeedRenditionRepository();

    const libraryEntries = Object.entries(librarySeed).map(
      ([bookId, seed]) => {
        const durationSec = getBook(bookId).durationSec;
        return {
          bookId,
          status: seed.status,
          positionSec: (seed.position ?? 0) * durationSec,
        };
      },
    );
    const progressEntries = libraryEntries.map(entry => ({
      bookId: entry.bookId,
      renditionId: seedRenditionId(entry.bookId),
      positionSec: entry.positionSec,
      durationSec: getBook(entry.bookId).durationSec,
    }));

    const library = new ObservableLibraryRepository(libraryEntries);
    const progress = new ObservableProgressRepository(progressEntries);
    const service = new LibraryService({
      catalogue,
      renditions,
      library,
      progress,
    });

    return new ServiceLibraryProviderAdapter(
      service,
      library,
      progress,
      seedRenditionId,
      bookId => getBook(bookId).durationSec,
    );
  };

const statusAfterPosition = (
  status: LibraryStatus | undefined,
): LibraryStatus => (status === 'finished' ? 'finished' : 'listening');

export {seedRenditionId};
