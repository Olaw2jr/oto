import type {
  AudioRendition,
  BookId,
  RenditionId,
} from '../domain';

export interface RenditionRepository {
  get(id: RenditionId): Promise<AudioRendition | null>;
  listForWork(workId: BookId): Promise<AudioRendition[]>;
}
