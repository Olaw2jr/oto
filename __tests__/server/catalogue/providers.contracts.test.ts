import {
  FakeAssetProvider,
  FakeAudioCatalogueProvider,
  FakeMetadataProvider,
} from '../../../../server/catalogue/providers/fakes';
import type {
  ExternalBookRef,
  ProviderAssetManifest,
  ProviderAudioRendition,
  ProviderBookRecord,
} from '../../../../server/catalogue/providers/contracts';

describe('catalogue provider contracts', () => {
  const ref: ExternalBookRef = {providerId: 'test', externalId: 'book-1'};

  it('allows metadata providers to be replaced by deterministic fakes', async () => {
    const record: ProviderBookRecord = {
      ref,
      title: {value: 'Book One', providerId: 'test', fetchedAt: '2026-10-05T00:00:00Z'},
      authors: {value: ['Author One'], providerId: 'test', fetchedAt: '2026-10-05T00:00:00Z'},
      subjects: {value: ['Fiction'], providerId: 'test', fetchedAt: '2026-10-05T00:00:00Z'},
      identifiers: {},
    };
    const provider = new FakeMetadataProvider([record]);

    expect((await provider.search({text: 'Book'}))[0]?.ref).toEqual(ref);
    expect(await provider.get(ref)).toEqual(record);
  });

  it('keeps audio discovery and asset resolution behind separate providers', async () => {
    const rendition: ProviderAudioRendition = {
      ref: {providerId: 'audio-test', externalId: 'audio-1'},
      workHint: {title: 'Book One', authors: ['Author One'], identifiers: {}},
      narrators: ['Narrator'],
      language: 'en',
      chapters: [],
      rights: {status: 'public-domain', source: 'test', verifiedAt: '2026-10-05T00:00:00Z'},
    };
    const manifest: ProviderAssetManifest = {
      ref: {providerId: 'asset-test', externalId: 'asset-1'},
      renditionRef: rendition.ref,
      format: 'mp3',
      sources: [{kind: 'https', uri: 'https://example.test/book.mp3'}],
      rights: rendition.rights,
    };

    expect((await new FakeAudioCatalogueProvider([rendition]).findRenditions(rendition.workHint))[0]).toEqual(rendition);
    expect((await new FakeAssetProvider([manifest]).resolveAssets(rendition))[0]).toEqual(manifest);
  });
});
