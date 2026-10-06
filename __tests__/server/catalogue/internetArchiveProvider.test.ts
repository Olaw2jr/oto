import {InternetArchiveProvider} from '../../../server/catalogue/providers/internetarchive/InternetArchiveProvider';
import type {
  JsonHttpClient,
  ProviderAudioRendition,
} from '../../../server/catalogue/providers';

class StubHttp implements JsonHttpClient {
  calls: string[] = [];
  constructor(private readonly response: unknown) {}
  async getJson<T>(url: string): Promise<T> {
    this.calls.push(url);
    return this.response as T;
  }
}

describe('InternetArchiveProvider', () => {
  it('resolves canonical HTTPS files and the item torrent for an authorized rendition', async () => {
    const http = new StubHttp({
      files: [
        {name: 'book_01.mp3', size: '1024', md5: 'abc', format: 'VBR MP3'},
        {name: 'book_archive.torrent', format: 'Archive BitTorrent'},
        {name: 'book_meta.sqlite', size: '88', format: 'Metadata'},
      ],
    });
    const provider = new InternetArchiveProvider(http);
    const rendition: ProviderAudioRendition = {
      ref: {providerId: 'librivox', externalId: '123'},
      assetRefs: [{providerId: 'internetarchive', externalId: 'book'}],
      workHint: {title: 'Book', authors: ['Author'], identifiers: {}},
      narrators: ['Reader'],
      language: 'en',
      chapters: [],
      rights: {status: 'public-domain', source: 'librivox', verifiedAt: '2026-10-05T00:00:00Z'},
    };

    const assets = await provider.resolveAssets(rendition);

    expect(assets).toHaveLength(1);
    expect(assets[0]?.format).toBe('mp3');
    expect(assets[0]?.sizeBytes).toBe(1024);
    expect(assets[0]?.sources).toContainEqual(expect.objectContaining({
      kind: 'https',
      uri: 'https://archive.org/download/book/book_01.mp3',
    }));
    expect(assets[0]?.sources).toContainEqual(expect.objectContaining({
      kind: 'torrent',
      torrentUri: 'https://archive.org/download/book/book_archive.torrent',
      filePath: 'book_01.mp3',
    }));
  });
});
