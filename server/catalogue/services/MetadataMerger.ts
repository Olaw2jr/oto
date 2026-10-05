import type {BookIdentifiers, BookWork} from '../../../app/domain';
import type {Provenanced, ProviderBookRecord, ProviderId} from '../providers';

export type MergedProvenance = {
  title?: Provenanced<string>;
  subtitle?: Provenanced<string>;
  authors?: Provenanced<string[]>;
  description?: Provenanced<string>;
  subjects?: Provenanced<string[]>;
};

export type MergedBook = {
  work: BookWork;
  provenance: MergedProvenance;
};

const mergeIdentifiers = (records: ProviderBookRecord[]): BookIdentifiers => {
  const isbn10 = new Set<string>();
  const isbn13 = new Set<string>();
  const result: BookIdentifiers = {};

  for (const {identifiers} of records) {
    identifiers.isbn10?.forEach(value => isbn10.add(value));
    identifiers.isbn13?.forEach(value => isbn13.add(value));
    result.openLibraryWorkId ??= identifiers.openLibraryWorkId;
    result.googleBooksVolumeId ??= identifiers.googleBooksVolumeId;
    result.gutenbergId ??= identifiers.gutenbergId;
  }

  if (isbn10.size) result.isbn10 = [...isbn10];
  if (isbn13.size) result.isbn13 = [...isbn13];
  return result;
};

export class MetadataMerger {
  constructor(private readonly priority: ProviderId[]) {}

  private rank(providerId: ProviderId): number {
    const index = this.priority.indexOf(providerId);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

  private first<T>(
    records: ProviderBookRecord[],
    select: (record: ProviderBookRecord) => Provenanced<T> | undefined,
  ): Provenanced<T> | undefined {
    return records
      .map(select)
      .filter((value): value is Provenanced<T> => Boolean(value))
      .sort((a, b) => this.rank(a.providerId) - this.rank(b.providerId))[0];
  }

  merge(records: ProviderBookRecord[]): MergedBook {
    if (!records.length) {
      throw new Error('MetadataMerger requires at least one record');
    }

    const title = this.first(records, record => record.title)!;
    const subtitle = this.first(records, record => record.subtitle);
    const authors = this.first(records, record => record.authors)!;
    const description = this.first(records, record => record.description);
    const subjects = this.first(records, record => record.subjects);
    const identifiers = mergeIdentifiers(records);
    const id =
      identifiers.openLibraryWorkId ??
      identifiers.isbn13?.[0] ??
      `work:${title.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

    return {
      work: {
        id,
        title: title.value,
        subtitle: subtitle?.value,
        authors: authors.value.map(name => ({name})),
        description: description?.value,
        subjects: subjects?.value ?? [],
        identifiers,
      },
      provenance: {title, subtitle, authors, description, subjects},
    };
  }
}
