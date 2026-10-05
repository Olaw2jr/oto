import type {
  AssetProvider,
  AudioCatalogueProvider,
  BookSearchQuery,
  CanonicalBookHint,
  ExternalBookRef,
  MetadataProvider,
  ProviderAssetManifest,
  ProviderAudioRendition,
  ProviderBookCandidate,
  ProviderBookRecord,
} from './contracts';

export class FakeMetadataProvider implements MetadataProvider {
  readonly id = 'fake-metadata';

  constructor(private readonly records: ProviderBookRecord[]) {}

  async search(query: BookSearchQuery): Promise<ProviderBookCandidate[]> {
    const needle = query.text.trim().toLowerCase();
    return this.records
      .filter(record => record.title.value.toLowerCase().includes(needle))
      .slice(0, query.limit ?? this.records.length)
      .map(record => ({
        ref: record.ref,
        title: record.title.value,
        authors: record.authors.value,
        identifiers: record.identifiers,
        score: 1,
      }));
  }

  async get(reference: ExternalBookRef): Promise<ProviderBookRecord | null> {
    return (
      this.records.find(
        record =>
          record.ref.providerId === reference.providerId &&
          record.ref.externalId === reference.externalId,
      ) ?? null
    );
  }
}

export class FakeAudioCatalogueProvider implements AudioCatalogueProvider {
  readonly id = 'fake-audio';

  constructor(private readonly renditions: ProviderAudioRendition[]) {}

  async findRenditions(book: CanonicalBookHint): Promise<ProviderAudioRendition[]> {
    const title = book.title.trim().toLowerCase();
    return this.renditions.filter(
      rendition => rendition.workHint.title.trim().toLowerCase() === title,
    );
  }
}

export class FakeAssetProvider implements AssetProvider {
  readonly id = 'fake-assets';

  constructor(private readonly manifests: ProviderAssetManifest[]) {}

  async resolveAssets(
    rendition: ProviderAudioRendition,
  ): Promise<ProviderAssetManifest[]> {
    return this.manifests.filter(
      manifest =>
        manifest.renditionRef.providerId === rendition.ref.providerId &&
        manifest.renditionRef.externalId === rendition.ref.externalId,
    );
  }
}
