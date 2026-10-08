import type {
  AudioRendition,
  BookId,
  BookWork,
  RenditionId,
} from '../../domain';
import type {
  CatalogueRepository,
  RenditionRepository,
} from '../../repositories';
import {
  catalogue,
  getBook,
  PUBLIC_DOMAIN_SAMPLE_ID,
  PUBLIC_DOMAIN_SAMPLE_CHAPTERS,
} from '../../data/catalogue';

const VERIFIED_AT = '1970-01-01T00:00:00.000Z';

export const seedRenditionId = (bookId: BookId): RenditionId =>
  `${bookId}:seed`;

const toWork = (bookId: BookId): BookWork => {
  const book = getBook(bookId);
  return {
    id: book.id,
    title: book.title,
    authors: [{name: book.author}],
    description: book.summary,
    subjects: book.genres,
    identifiers: {},
  };
};

const toRendition = (bookId: BookId): AudioRendition => {
  const book = getBook(bookId);
  const chapterDuration = book.durationSec / book.chapters;

  return {
    id: seedRenditionId(book.id),
    workId: book.id,
    narrators: [{name: book.narrator}],
    language: book.language,
    durationSec: book.durationSec,
    chapters: book.id === PUBLIC_DOMAIN_SAMPLE_ID
      ? PUBLIC_DOMAIN_SAMPLE_CHAPTERS.map((chapter, index) => ({
          id: `${book.id}:chapter-${index + 1}`,
          title: chapter.title,
          startSec: PUBLIC_DOMAIN_SAMPLE_CHAPTERS
            .slice(0, index)
            .reduce((total, item) => total + item.durationSec, 0),
          durationSec: chapter.durationSec,
        }))
      : Array.from({length: book.chapters}, (_, index) => {
      const startSec = index * chapterDuration;
      return {
        id: `${book.id}:chapter-${index + 1}`,
        title: `Chapter ${index + 1}`,
        startSec,
        durationSec:
          index === book.chapters - 1
            ? book.durationSec - startSec
            : chapterDuration,
      };
    }),
    rights:
      book.id === PUBLIC_DOMAIN_SAMPLE_ID
        ? {
            status: 'public-domain',
            source: 'librivox',
            verifiedAt: VERIFIED_AT,
          }
        : {
            status: 'unknown',
            source: 'seed-catalogue',
            verifiedAt: VERIFIED_AT,
          },
  };
};

export class SeedCatalogueRepository implements CatalogueRepository {
  async get(id: BookId): Promise<BookWork | null> {
    return catalogue.some(book => book.id === id) ? toWork(id) : null;
  }

  async list(): Promise<BookWork[]> {
    return catalogue.map(book => toWork(book.id));
  }
}

export class SeedRenditionRepository implements RenditionRepository {
  async get(id: RenditionId): Promise<AudioRendition | null> {
    const bookId = id.endsWith(':seed') ? id.slice(0, -5) : '';
    return catalogue.some(book => book.id === bookId)
      ? toRendition(bookId)
      : null;
  }

  async listForWork(workId: BookId): Promise<AudioRendition[]> {
    return catalogue.some(book => book.id === workId)
      ? [toRendition(workId)]
      : [];
  }
}
