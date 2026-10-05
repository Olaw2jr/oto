import type {BookId, ListeningProgress} from '../domain';

export interface ProgressRepository {
  get(bookId: BookId): Promise<ListeningProgress | null>;
  save(progress: ListeningProgress): Promise<void>;
}
