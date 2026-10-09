import {SourceResolver} from '../../app/audio/SourceResolver';
import type {MediaAsset, RightsInfo} from '../../app/domain';
import {RightsPolicy} from '../../app/domain/rights';
import {
  FakeContentTransport,
  TransportRegistry,
} from '../../app/transports';

const rights: RightsInfo = {
  status: 'public-domain',
  source: 'librivox',
  verifiedAt: '2026-10-05T00:00:00Z',
};

const asset: MediaAsset = {
  id: 'asset-1',
  renditionId: 'rendition-1',
  format: 'mp3',
  sources: [
    {
      kind: 'torrent',
      torrentUri: 'https://archive.org/book.torrent',
      filePath: 'book.mp3',
      trustedSourceId: 'internetarchive',
    },
    {
      kind: 'https',
      uri: 'https://archive.org/book.mp3',
      trustedSourceId: 'internetarchive',
    },
  ],
};

describe('SourceResolver', () => {
  it('prefers an already-downloaded local asset', async () => {
    const local = new FakeContentTransport('local');
    const https = new FakeContentTransport('https');
    const torrent = new FakeContentTransport('torrent');
    const resolver = new SourceResolver(
      new TransportRegistry([local, https, torrent]),
      new RightsPolicy('TZ', ['internetarchive']),
      {locate: async () => ({kind: 'local', uri: 'file:///downloads/book.mp3'})},
    );

    const playable = await resolver.resolve(asset, rights);

    expect(playable.transport).toBe('local');
  });

  it('prefers trusted HTTPS over torrent when no local copy exists', async () => {
    const resolver = new SourceResolver(
      new TransportRegistry([
        new FakeContentTransport('https'),
        new FakeContentTransport('torrent'),
      ]),
      new RightsPolicy('TZ', ['internetarchive']),
      {locate: async () => null},
    );

    const playable = await resolver.resolve(asset, rights);

    expect(playable.transport).toBe('https');
  });

  it('prefers HTTPS whichever order the provider lists sources in', async () => {
    const resolver = new SourceResolver(
      new TransportRegistry([
        new FakeContentTransport('https'),
        new FakeContentTransport('torrent'),
      ]),
      new RightsPolicy('TZ', ['internetarchive']),
      {locate: async () => null},
    );

    const playable = await resolver.resolve(
      {...asset, sources: [...asset.sources].reverse()},
      rights,
    );

    expect(playable.transport).toBe('https');
  });

  it('refuses assets with no authorized source', async () => {
    const resolver = new SourceResolver(
      new TransportRegistry([new FakeContentTransport('torrent')]),
      new RightsPolicy('TZ', ['internetarchive']),
      {locate: async () => null},
    );
    const untrusted: MediaAsset = {
      ...asset,
      sources: [{kind: 'torrent', magnetUri: 'magnet:?xt=urn:btih:abc', trustedSourceId: 'unknown'}],
    };

    await expect(resolver.resolve(untrusted, rights)).rejects.toThrow('No authorized media source');
  });
});
