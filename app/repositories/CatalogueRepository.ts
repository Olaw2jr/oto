import type {BookId, BookWork} from '../domain';

export interface CatalogueRepository {
  get(id: BookId): Promise<BookWork | null>;
  list(): Promise<BookWork[]>;
}
