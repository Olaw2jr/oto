import {FakeAudioEngine, SourceResolver} from '../../app/audio';
import {ChapterPlaybackSession} from '../../app/audio/session/ChapterPlaybackSession';
import type {
  AudioRendition,
  BookWork,
  LibraryEntry,
  ListeningProgress,
  MediaAsset,
} from '../../app/domain';
import {RightsPolicy} from '../../app/domain/rights';
import {
  PlaybackQueueResolver,
  PlayerController,
} from '../../app/player';
import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
  RenditionRepository,
} from '../../app/repositories';
import {LibraryService} from '../../app/services/LibraryService';
import {
  FakeContentTransport,
  TransportRegistry,
} from '../../app/transports';

const book: BookWork = {
  id: 'book-1',
  title: 'Public Domain Book',
  authors: [{name: 'Author'}],
  subjects: [],
  identifiers: {},
};

const rendition: AudioRendition = {
  id: 'rendition-1',
  workId: book.id,
  narrators: [{name: 'Reader'}],
  language: 'en',
  durationSec: 300,
  chapters: [
    {id: 'chapter-1', title: 'Chapter 1', startSec: 0, durationSec: 120},
    {id: 'chapter-2', title: 'Chapter 2', startSec: 120, durationSec: 180},
  ],
  rights: {
    status: 'public-domain',
    source: 'librivox',
    verifiedAt: '2026-10-07T00:00:00.000Z',
  },
};

const assets: MediaAsset[] = rendition.chapters.map((chapter, index) => ({
  id: `asset-${index + 1}`,
  renditionId: rendition.id,
  format: 'mp3',
  sources: [{
    kind: 'https',
    uri: `https://archive.example.test/chapter-${index + 1}.mp3`,
    trustedSourceId: 'internetarchive',
  }],
}));

const setup = (initialPosition: number) => {
  const libraryRows = new Map<string, LibraryEntry>();
  const progressRows = new Map<string, ListeningProgress>([
    [`${book.id}:${rendition.id}`, {
      bookId: book.id,
      renditionId: rendition.id,
      chapterId: 'chapter-2',
      positionSec: initialPosition,
      durationSec: rendition.durationSec!,
    }],
  ]);

  const catalogue: CatalogueRepository = {
    get: async id => (id === book.id ? book : null),
    list: async () => [book],
  };
  const renditions: RenditionRepository = {
    get: async id => (id === rendition.id ? rendition : null),
    listForWork: async id => (id === book.id ? [rendition] : []),
  };
  const library: LibraryRepository = {
    get: async id => libraryRows.get(id) ?? null,
    list: async () => [...libraryRows.values()],
    save: async entry => {
      libraryRows.set(entry.bookId, {...entry});
    },
    remove: async id => {
      libraryRows.delete(id);
    },
  };
  const progress: ProgressRepository = {
    get: async (bookId, renditionId) =>
      progressRows.get(`${bookId}:${renditionId}`) ?? null,
    save: async value => {
      progressRows.set(
        `${value.bookId}:${value.renditionId}`,
        {...value},
      );
    },
  };

  const service = new LibraryService({
    catalogue,
    renditions,
    library,
    progress,
  });
  const engine = new FakeAudioEngine();
  const session = new ChapterPlaybackSession(engine, service);
  const queueResolver = new PlaybackQueueResolver(
    catalogue,
    renditions,
    {
      listForRendition: async id =>
        id === rendition.id
          ? rendition.chapters.map((chapter, index) => ({
              chapterId: chapter.id,
              asset: assets[index],
            }))
          : [],
    },
    new SourceResolver(
      new TransportRegistry([new FakeContentTransport('https')]),
      new RightsPolicy('TZ', ['internetarchive']),
      {locate: async () => null},
    ),
  );
  const controller = new PlayerController(engine, {
    session,
    queueResolver,
  });

  return {controller, engine, session, progress};
};

describe('PlayerController durable book sessions', () => {
  it('loads an authorized queue and resumes durable rendition progress', async () => {
    const {controller, engine} = setup(150);

    await controller.loadBook(book.id);

    expect(controller.getSnapshot()).toMatchObject({
      bookId: book.id,
      renditionId: rendition.id,
      trackId: `${rendition.id}:chapter-2`,
      positionSec: 150,
      durationSec: 300,
    });
    await expect(engine.getSnapshot()).resolves.toMatchObject({
      trackId: `${rendition.id}:chapter-2`,
      positionSec: 30,
    });
  });

  it('persists controller seeks through ChapterPlaybackSession', async () => {
    const {controller, session, progress} = setup(150);

    await controller.loadBook(book.id);
    await controller.seekTo(175);
    await session.flush();

    await expect(progress.get(book.id, rendition.id)).resolves.toMatchObject({
      chapterId: 'chapter-2',
      positionSec: 175,
      durationSec: 300,
    });
  });
});
