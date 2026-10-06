import type {
  BookId,
  LibraryEntry,
  ListeningProgress,
  RenditionId,
} from '../../domain';
import type {
  LibraryRepository,
  ProgressRepository,
} from '../../repositories';

type Listener = () => void;

export class ObservableLibraryRepository implements LibraryRepository {
  private readonly entries = new Map<BookId, LibraryEntry>();
  private readonly listeners = new Set<Listener>();
  private revision = 0;

  constructor(seed: LibraryEntry[] = []) {
    for (const entry of seed) {
      this.entries.set(entry.bookId, {...entry});
    }
  }

  getSnapshot = (): number => this.revision;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  peek(bookId: BookId): LibraryEntry | null {
    const entry = this.entries.get(bookId);
    return entry ? {...entry} : null;
  }

  listSync(): LibraryEntry[] {
    return [...this.entries.values()].map(entry => ({...entry}));
  }

  setOptimistic(entry: LibraryEntry): void {
    this.entries.set(entry.bookId, {...entry});
    this.revision += 1;
    for (const listener of this.listeners) {
      listener();
    }
  }

  async get(bookId: BookId): Promise<LibraryEntry | null> {
    return this.peek(bookId);
  }

  async list(): Promise<LibraryEntry[]> {
    return this.listSync();
  }

  async save(entry: LibraryEntry): Promise<void> {
    this.setOptimistic(entry);
  }

  async remove(bookId: BookId): Promise<void> {
    if (this.entries.delete(bookId)) {
      this.revision += 1;
      for (const listener of this.listeners) {
        listener();
      }
    }
  }
}

export class ObservableProgressRepository implements ProgressRepository {
  private readonly entries = new Map<string, ListeningProgress>();

  constructor(seed: ListeningProgress[] = []) {
    for (const progress of seed) {
      this.entries.set(this.key(progress.bookId, progress.renditionId), {
        ...progress,
      });
    }
  }

  private key(bookId: BookId, renditionId: RenditionId): string {
    return `${bookId}:${renditionId}`;
  }

  peek(
    bookId: BookId,
    renditionId: RenditionId,
  ): ListeningProgress | null {
    const progress = this.entries.get(this.key(bookId, renditionId));
    return progress ? {...progress} : null;
  }

  setOptimistic(progress: ListeningProgress): void {
    this.entries.set(
      this.key(progress.bookId, progress.renditionId),
      {...progress},
    );
  }

  async get(
    bookId: BookId,
    renditionId: RenditionId,
  ): Promise<ListeningProgress | null> {
    return this.peek(bookId, renditionId);
  }

  async save(progress: ListeningProgress): Promise<void> {
    this.setOptimistic(progress);
  }
}
