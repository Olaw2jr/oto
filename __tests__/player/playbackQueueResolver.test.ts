import {SourceResolver} from '../../app/audio';
import type {
  AudioRendition,
  BookWork,
  MediaAsset,
  RightsInfo,
} from '../../app/domain';
import {RightsPolicy} from '../../app/domain/rights';
import {
  PlaybackQueueResolver,
  PlaybackUnavailableError,
  type PlaybackAssetBinding,
  type PlaybackAssetRepository,
} from '../../app/player/PlaybackQueueResolver';
import type {
  CatalogueRepository,
  RenditionRepository,
} from '../../app/repositories';
import {
  FakeContentTransport,
  TransportRegistry,
} from '../../app/transports';

const work: BookWork = {
  id: 'book-1',
  title: 'Public Domain Book',
  authors: [{name: 'Example Author'}],
  description: 'A test book',
  subjects: [],
  identifiers: {},
};

const rights: RightsInfo = {
  status: 'public-domain',
  source: 'librivox',
  verifiedAt: '2026-10-07T00:00:00.000Z',
};

const rendition: AudioRendition = {
  id: 'rendition-1',
  workId: work.id,
  narrators: [{name: 'Example Reader'}],
  language: 'English',
  durationSec: 300,
  chapters: [
    {id: 'chapter-1', title: 'Chapter 1', startSec: 0, durationSec: 120},
    {id: 'chapter-2', title: 'Chapter 2', startSec: 120, durationSec: 180},
  ],
  rights,
};

const assets: PlaybackAssetBinding[] = rendition.chapters.map((chapter, index) => ({
  chapterId: chapter.id,
  asset: {
    id: `asset-${index + 1}`,
    renditionId: rendition.id,
    format: 'mp3',
    sources: [
      {
        kind: 'https',
        uri: `https://archive.example.test/chapter-${index + 1}.mp3`,
        trustedSourceId: 'internetarchive',
      },
    ],
  } satisfies MediaAsset,
}));

const catalogue: CatalogueRepository = {
  get: async id => (id === work.id ? work : null),
  list: async () => [work],
};

const renditions: RenditionRepository = {
  get: async id => (id === rendition.id ? rendition : null),
  listForWork: async id => (id === work.id ? [rendition] : []),
};

const assetRepository: PlaybackAssetRepository = {
  listForRendition: async id => (id === rendition.id ? assets : []),
};

const createResolver = () =>
  new PlaybackQueueResolver(
    catalogue,
    renditions,
    assetRepository,
    new SourceResolver(
      new TransportRegistry([new FakeContentTransport('https')]),
      new RightsPolicy('TZ', ['internetarchive']),
      {locate: async () => null},
    ),
  );

describe('PlaybackQueueResolver', () => {
  it('builds one authorized AudioTrack per rendition chapter', async () => {
    const queue = await createResolver().resolve(work.id);

    expect(queue.bookId).toBe(work.id);
    expect(queue.renditionId).toBe(rendition.id);
    expect(queue.tracks).toHaveLength(2);
    expect(queue.tracks[0]).toMatchObject({
      id: 'rendition-1:chapter-1',
      bookId: work.id,
      renditionId: rendition.id,
      chapterId: 'chapter-1',
      title: 'Chapter 1',
      artist: 'Example Reader',
      album: work.title,
      durationSec: 120,
      source: {
        kind: 'remote',
        mimeType: 'audio/mpeg',
      },
    });
    expect(queue.tracks[1].source.uri).toContain('fake://https/');
  });

  it('infers a missing chapter duration from the next chapter start', async () => {
    const inferred: AudioRendition = {
      ...rendition,
      chapters: [
        {id: 'chapter-1', title: 'Chapter 1', startSec: 0},
        {id: 'chapter-2', title: 'Chapter 2', startSec: 120, durationSec: 180},
      ],
    };
    const resolver = new PlaybackQueueResolver(
      catalogue,
      {
        get: async () => inferred,
        listForWork: async () => [inferred],
      },
      assetRepository,
      new SourceResolver(
        new TransportRegistry([new FakeContentTransport('https')]),
        new RightsPolicy('TZ', ['internetarchive']),
        {locate: async () => null},
      ),
    );

    const queue = await resolver.resolve(work.id);
    expect(queue.tracks[0].durationSec).toBe(120);
  });

  it('fails closed when a chapter has no authorized media asset', async () => {
    const resolver = new PlaybackQueueResolver(
      catalogue,
      renditions,
      {
        listForRendition: async () => assets.slice(0, 1),
      },
      new SourceResolver(
        new TransportRegistry([new FakeContentTransport('https')]),
        new RightsPolicy('TZ', ['internetarchive']),
        {locate: async () => null},
      ),
    );

    await expect(resolver.resolve(work.id)).rejects.toThrow(
      'Missing media asset for chapter chapter-2',
    );
  });

  it('reports a book without rights-cleared audio as unavailable', async () => {
    const resolver = new PlaybackQueueResolver(
      catalogue,
      {
        get: async () => null,
        listForWork: async () => [
          {...rendition, rights: {...rights, status: 'unknown'}},
        ],
      },
      assetRepository,
      new SourceResolver(
        new TransportRegistry([new FakeContentTransport('https')]),
        new RightsPolicy('TZ', ['internetarchive']),
        {locate: async () => null},
      ),
    );

    await expect(resolver.resolve(work.id)).rejects.toBeInstanceOf(
      PlaybackUnavailableError,
    );
  });

  it('reports a missing chapter asset as unavailable', async () => {
    const resolver = new PlaybackQueueResolver(
      catalogue,
      renditions,
      {listForRendition: async () => assets.slice(0, 1)},
      new SourceResolver(
        new TransportRegistry([new FakeContentTransport('https')]),
        new RightsPolicy('TZ', ['internetarchive']),
        {locate: async () => null},
      ),
    );

    await expect(resolver.resolve(work.id)).rejects.toBeInstanceOf(
      PlaybackUnavailableError,
    );
  });
});
