import {SourceResolver} from '../../app/audio';
import type {AudioRendition, MediaAsset} from '../../app/domain';
import {RightsPolicy} from '../../app/domain/rights';
import {
  BookDownloads,
  createDownloadedAssetLocator,
  FakeDownloadEngine,
} from '../../app/downloads';
import type {PlaybackAssetBinding} from '../../app/player';
import {FakeContentTransport, LocalFileTransport, TransportRegistry} from '../../app/transports';

const rendition: AudioRendition = {
  id: 'rendition-1',
  workId: 'book-1',
  narrators: [{name: 'Reader'}],
  language: 'en',
  durationSec: 300,
  chapters: [
    {id: 'chapter-1', title: 'Chapter 1', startSec: 0, durationSec: 120},
    {id: 'chapter-2', title: 'Chapter 2', startSec: 120, durationSec: 180},
  ],
  rights: {status: 'public-domain', source: 'librivox', verifiedAt: '2026-10-07T00:00:00.000Z'},
};

const asset = (index: number, extra: Partial<MediaAsset> = {}): MediaAsset => ({
  id: `asset-${index}`,
  renditionId: rendition.id,
  format: 'mp3',
  sizeBytes: 1000 * index,
  sources: [
    {kind: 'torrent', torrentUri: 'https://archive.org/x.torrent', filePath: `c${index}.mp3`, trustedSourceId: 'internetarchive'},
    {kind: 'https', uri: `https://archive.org/c${index}.mp3`, trustedSourceId: 'internetarchive'},
  ],
  ...extra,
});

const setup = (rights = rendition.rights) => {
  const engine = new FakeDownloadEngine();
  const bindings: PlaybackAssetBinding[] = [
    {chapterId: 'chapter-1', asset: asset(1)},
    {chapterId: 'chapter-2', asset: asset(2)},
  ];
  const downloads = new BookDownloads({
    engine,
    renditions: {listForWork: async () => [{...rendition, rights}]},
    assets: {listForRendition: async () => bindings},
    rightsPolicy: new RightsPolicy('TZ', ['internetarchive']),
  });
  return {engine, downloads};
};

describe('BookDownloads', () => {
  it('downloads every chapter over HTTPS, keyed like playback', async () => {
    const {engine, downloads} = setup();

    await downloads.downloadBook('book-1', {wifiOnly: true});

    expect(engine.requests).toEqual([
      {id: 'asset-1', bookId: 'book-1', uri: 'https://archive.org/c1.mp3', cacheKey: 'rendition-1:chapter-1', title: 'Chapter 1', trustedSourceId: 'internetarchive', sizeBytes: 1000, wifiOnly: true},
      {id: 'asset-2', bookId: 'book-1', uri: 'https://archive.org/c2.mp3', cacheKey: 'rendition-1:chapter-2', title: 'Chapter 2', trustedSourceId: 'internetarchive', sizeBytes: 2000, wifiOnly: true},
    ]);
  });

  it('refuses books without rights-cleared audio', async () => {
    const {downloads} = setup({status: 'unknown', source: 'seed', verifiedAt: '2026-10-07T00:00:00.000Z'});
    await expect(downloads.downloadBook('book-1', {wifiOnly: false})).rejects.toThrow(
      'This book has no audio that can be downloaded',
    );
  });

  it('sums chapter progress into one status per book', async () => {
    const {engine, downloads} = setup();
    await downloads.downloadBook('book-1', {wifiOnly: false});
    engine.progress('asset-1', 1000, 1000, 'completed');
    engine.progress('asset-2', 500, 2000, 'downloading');

    expect(await downloads.bookStatus('book-1')).toEqual({
      state: 'downloading',
      chaptersDone: 1,
      chapters: 2,
      bytesDownloaded: 1500,
      totalBytes: 3000,
    });

    engine.progress('asset-2', 2000, 2000, 'completed');
    expect((await downloads.bookStatus('book-1')).state).toBe('completed');
    expect((await downloads.bookStatus('other')).state).toBe('none');
  });

  it('removes every chapter of a book', async () => {
    const {engine, downloads} = setup();
    await downloads.downloadBook('book-1', {wifiOnly: false});
    await downloads.removeBook('book-1');
    expect(await engine.list()).toEqual([]);
  });

  it('applies the Wi-Fi-only setting to downloads in progress', async () => {
    const {engine, downloads} = setup();
    await downloads.setWifiOnly(false);
    expect(engine.wifiOnly).toBe(false);
  });
});

describe('downloaded playback', () => {
  it('plays a completed download before streaming', async () => {
    const engine = new FakeDownloadEngine();
    await engine.start({id: 'asset-1', bookId: 'book-1', uri: 'https://archive.org/c1.mp3', cacheKey: 'k', title: 'Chapter 1', wifiOnly: false});
    engine.progress('asset-1', 1000, 1000, 'completed');
    const resolver = new SourceResolver(
      new TransportRegistry([new FakeContentTransport('https'), new LocalFileTransport()]),
      new RightsPolicy('TZ', ['internetarchive']),
      createDownloadedAssetLocator(engine),
    );

    const playable = await resolver.resolve(asset(1), rendition.rights);

    expect(playable).toMatchObject({transport: 'local', uri: 'file:///downloads/asset-1'});
  });

  it('streams while a download is unfinished', async () => {
    const engine = new FakeDownloadEngine();
    await engine.start({id: 'asset-1', bookId: 'book-1', uri: 'https://archive.org/c1.mp3', cacheKey: 'k', title: 'Chapter 1', wifiOnly: false});
    const resolver = new SourceResolver(
      new TransportRegistry([new FakeContentTransport('https'), new LocalFileTransport()]),
      new RightsPolicy('TZ', ['internetarchive']),
      createDownloadedAssetLocator(engine),
    );
    expect((await resolver.resolve(asset(1), rendition.rights)).transport).toBe('https');
  });
});
