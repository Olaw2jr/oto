import type {Book, BookId} from '../domain';

export interface CatalogueRepository {
  get(id: BookId): Promise<Book | null>;
  list(): Promise<Book[]>;
}
