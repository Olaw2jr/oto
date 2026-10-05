import type {
  BookId,
  ListeningProgress,
  RenditionId,
} from '../domain';

export interface ProgressRepository {
  get(
    bookId: BookId,
    renditionId: RenditionId,
  ): Promise<ListeningProgress | null>;
  save(progress: ListeningProgress): Promise<void>;
}
