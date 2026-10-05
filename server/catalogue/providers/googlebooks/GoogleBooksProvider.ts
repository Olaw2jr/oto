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

type IndustryIdentifier = {type?: string; identifier?: string};

type VolumeInfo = {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: IndustryIdentifier[];
  categories?: string[];
  language?: string;
  imageLinks?: {thumbnail?: string; smallThumbnail?: string};
};

type Volume = {id?: string; volumeInfo?: VolumeInfo};
type VolumeList = {items?: Volume[]};

type Options = {
  apiKey?: string;
  baseUrl?: string;
  now?: () => string;
};

const identifiersFrom = (
  volumeId: string,
  values: IndustryIdentifier[] = [],
): BookIdentifiers => {
  const isbn10 = values
    .filter(value => value.type === 'ISBN_10' && value.identifier)
    .map(value => value.identifier as string);
  const isbn13 = values
    .filter(value => value.type === 'ISBN_13' && value.identifier)
    .map(value => value.identifier as string);
  return {
    googleBooksVolumeId: volumeId,
    ...(isbn10.length ? {isbn10} : {}),
    ...(isbn13.length ? {isbn13} : {}),
  };
};

export class GoogleBooksProvider implements MetadataProvider {
  readonly id = 'googlebooks';
  private readonly baseUrl: string;
  private readonly now: () => string;

  constructor(
    private readonly http: JsonHttpClient,
    private readonly options: Options = {},
  ) {
    this.baseUrl = options.baseUrl ?? 'https://www.googleapis.com/books/v1';
    this.now = options.now ?? (() => new Date().toISOString());
  }

  private withKey(url: string): string {
    return this.options.apiKey
      ? `${url}&key=${encodeURIComponent(this.options.apiKey)}`
      : url;
  }

  private sourced<T>(value: T, externalId: string): Provenanced<T> {
    return {
      value,
      providerId: this.id,
      externalId,
      fetchedAt: this.now(),
    };
  }

  async search(query: BookSearchQuery): Promise<ProviderBookCandidate[]> {
    const limit = Math.max(1, Math.min(query.limit ?? 20, 40));
    let url =
      `${this.baseUrl}/volumes?q=${encodeURIComponent(query.text)}` +
      `&maxResults=${limit}&printType=books`;
    if (query.language) {
      url += `&langRestrict=${encodeURIComponent(query.language)}`;
    }
    const response = await this.http.getJson<VolumeList>(this.withKey(url));

    return (response.items ?? []).flatMap(volume => {
      const id = volume.id;
      const info = volume.volumeInfo;
      if (!id || !info?.title) return [];
      return [{
        ref: {providerId: this.id, externalId: id},
        title: info.title,
        authors: info.authors ?? [],
        identifiers: identifiersFrom(id, info.industryIdentifiers),
      }];
    });
  }

  async get(reference: ExternalBookRef): Promise<ProviderBookRecord | null> {
    if (reference.providerId !== this.id || !reference.externalId) return null;
    const suffix = this.options.apiKey
      ? `?key=${encodeURIComponent(this.options.apiKey)}`
      : '';
    const volume = await this.http.getJson<Volume>(
      `${this.baseUrl}/volumes/${encodeURIComponent(reference.externalId)}${suffix}`,
    );
    const info = volume.volumeInfo;
    if (!info?.title) return null;
    const id = volume.id ?? reference.externalId;

    return {
      ref: {providerId: this.id, externalId: id},
      title: this.sourced(info.title, id),
      subtitle: info.subtitle ? this.sourced(info.subtitle, id) : undefined,
      authors: this.sourced(info.authors ?? [], id),
      description: info.description
        ? this.sourced(info.description, id)
        : undefined,
      subjects: this.sourced(info.categories ?? [], id),
      identifiers: identifiersFrom(id, info.industryIdentifiers),
      publishedAt: info.publishedDate
        ? this.sourced(info.publishedDate, id)
        : undefined,
      publisher: info.publisher ? this.sourced(info.publisher, id) : undefined,
      language: info.language ? this.sourced(info.language, id) : undefined,
      coverUri: info.imageLinks?.thumbnail
        ? this.sourced(info.imageLinks.thumbnail, id)
        : info.imageLinks?.smallThumbnail
        ? this.sourced(info.imageLinks.smallThumbnail, id)
        : undefined,
    };
  }
}
