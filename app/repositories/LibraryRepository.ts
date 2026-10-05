import type {BookId, LibraryEntry} from '../domain';

export interface LibraryRepository {
  get(bookId: BookId): Promise<LibraryEntry | null>;
  list(): Promise<LibraryEntry[]>;
  save(entry: LibraryEntry): Promise<void>;
  remove(bookId: BookId): Promise<void>;
}
