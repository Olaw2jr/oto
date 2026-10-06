import {RightsPolicy} from '../../app/domain/rights';
import {PolicyEnforcedAssetProvider} from '../../server/catalogue/services/PolicyEnforcedAssetProvider';
import {FakeAssetProvider} from '../../server/catalogue/providers/fakes';
import type {ProviderAssetManifest, ProviderAudioRendition} from '../../server/catalogue/providers';

const rendition: ProviderAudioRendition = {
  ref: {providerId: 'librivox', externalId: 'book-1'},
  workHint: {title: 'Book', authors: ['Author'], identifiers: {}},
  narrators: ['Reader'],
  language: 'en',
  chapters: [],
  rights: {
    status: 'public-domain',
    source: 'librivox',
    verifiedAt: '2026-10-05T00:00:00Z',
    territories: ['TZ'],
  },
};

describe('rights and trusted source policy', () => {
  it('fails closed for unknown rights, untrusted remotes and excluded territories', () => {
    const policy = new RightsPolicy('TZ', ['internetarchive']);

    expect(policy.evaluate(
      {status: 'unknown', source: 'test', verifiedAt: '2026-10-05T00:00:00Z'},
      {kind: 'https', trustedSourceId: 'internetarchive'},
    ).allowed).toBe(false);

    expect(policy.evaluate(
      rendition.rights,
      {kind: 'torrent', trustedSourceId: 'random-index'},
    ).allowed).toBe(false);

    expect(new RightsPolicy('KE', ['internetarchive']).evaluate(
      rendition.rights,
      {kind: 'https', trustedSourceId: 'internetarchive'},
    ).allowed).toBe(false);
  });

  it('filters provider manifests to trusted, rights-allowed sources', async () => {
    const manifest: ProviderAssetManifest = {
      ref: {providerId: 'internetarchive', externalId: 'book/file.mp3'},
      renditionRef: rendition.ref,
      format: 'mp3',
      rights: rendition.rights,
      sources: [
        {kind: 'https', uri: 'https://archive.org/file.mp3', trustedSourceId: 'internetarchive'},
        {kind: 'torrent', magnetUri: 'magnet:?xt=urn:btih:abc', trustedSourceId: 'unknown'},
      ],
    };
    const provider = new PolicyEnforcedAssetProvider(
      new FakeAssetProvider([manifest]),
      new RightsPolicy('TZ', ['internetarchive']),
    );

    const assets = await provider.resolveAssets(rendition);

    expect(assets[0]?.sources).toHaveLength(1);
    expect(assets[0]?.sources[0]?.kind).toBe('https');
  });
});
