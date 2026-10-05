import type {BookIdentifiers} from '../../../../app/domain';
import type {
  BookSearchQuery,
  ExternalBookRef,
  JsonHttpClient,
  MetadataProvider,
  Provenanced,
  ProviderBookCandidate,
  ProviderBookRecord,
} from '../contracts';

type SearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  isbn?: string[];
};

type SearchResponse = {docs?: SearchDoc[]};

type WorkResponse = {
  key?: string;
  title?: string;
  description?: string | {value?: string};
  subjects?: string[];
  first_publish_date?: string;
  covers?: number[];
};

type Options = {
  userAgent: string;
  baseUrl?: string;
  now?: () => string;
};

const workId = (key?: string): string | null => {
  const value = key?.split('/').filter(Boolean).pop();
  return value || null;
};

const identifiersFrom = (values: string[] = []): BookIdentifiers => {
  const isbn10 = values.filter(value => value.replace(/[^0-9Xx]/g, '').length === 10);
  const isbn13 = values.filter(value => value.replace(/\D/g, '').length === 13);
  return {
    ...(isbn10.length ? {isbn10} : {}),
    ...(isbn13.length ? {isbn13} : {}),
  };
};

export class OpenLibraryProvider implements MetadataProvider {
  readonly id = 'openlibrary';
  private readonly baseUrl: string;
  private readonly now: () => string;

  constructor(
    private readonly http: JsonHttpClient,
    private readonly options: Options,
  ) {
    this.baseUrl = options.baseUrl ?? 'https://openlibrary.org';
    this.now = options.now ?? (() => new Date().toISOString());
  }

  private headers(): Record<string, string> {
    return {'User-Agent': this.options.userAgent};
  }

  private sourced<T>(value: T, externalId?: string): Provenanced<T> {
    return {
      value,
      providerId: this.id,
      externalId,
      fetchedAt: this.now(),
    };
  }

  async search(query: BookSearchQuery): Promise<ProviderBookCandidate[]> {
    const limit = Math.max(1, Math.min(query.limit ?? 20, 100));
    const url =
      `${this.baseUrl}/search.json?q=${encodeURIComponent(query.text)}` +
      `&fields=key,title,author_name,isbn&limit=${limit}`;
    const response = await this.http.getJson<SearchResponse>(url, this.headers());

    return (response.docs ?? []).flatMap(doc => {
      const externalId = workId(doc.key);
      if (!externalId || !doc.title) return [];
      return [{
        ref: {providerId: this.id, externalId},
        title: doc.title,
        authors: doc.author_name ?? [],
        identifiers: {
          ...identifiersFrom(doc.isbn),
          openLibraryWorkId: externalId,
        },
      }];
    });
  }

  async get(reference: ExternalBookRef): Promise<ProviderBookRecord | null> {
    if (reference.providerId !== this.id || !reference.externalId) return null;
    const response = await this.http.getJson<WorkResponse>(
      `${this.baseUrl}/works/${encodeURIComponent(reference.externalId)}.json`,
      this.headers(),
    );
    if (!response.title) return null;

    const description =
      typeof response.description === 'string'
        ? response.description
        : response.description?.value;
    const coverId = response.covers?.[0];

    return {
      ref: reference,
      title: this.sourced(response.title, reference.externalId),
      authors: this.sourced([], reference.externalId),
      description: description
        ? this.sourced(description, reference.externalId)
        : undefined,
      subjects: this.sourced(response.subjects ?? [], reference.externalId),
      identifiers: {openLibraryWorkId: reference.externalId},
      publishedAt: response.first_publish_date
        ? this.sourced(response.first_publish_date, reference.externalId)
        : undefined,
      coverUri: coverId
        ? this.sourced(
            `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
            reference.externalId,
          )
        : undefined,
    };
  }
}
