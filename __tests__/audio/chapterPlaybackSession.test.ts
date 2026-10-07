import type {
  AudioTrack,
} from '../../app/audio';
import {FakeAudioEngine} from '../../app/audio/testing/FakeAudioEngine';
import {ChapterPlaybackSession} from '../../app/audio/session/ChapterPlaybackSession';
import type {
  AudioRendition,
  BookWork,
  LibraryEntry,
  ListeningProgress,
} from '../../app/domain';
import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
  RenditionRepository,
} from '../../app/repositories';
import {LibraryService} from '../../app/services/LibraryService';

const book: BookWork = {
  id: 'book-1',
  title: 'Book One',
  authors: [{name: 'Author'}],
  subjects: [],
  identifiers: {},
};

const rendition: AudioRendition = {
  id: 'rendition-1',
  workId: book.id,
  narrators: [{name: 'Narrator'}],
  language: 'en',
  durationSec: 300,
  chapters: [
    {id: 'chapter-1', title: 'Chapter 1', startSec: 0, durationSec: 100},
    {id: 'chapter-2', title: 'Chapter 2', startSec: 100, durationSec: 200},
  ],
  rights: {
    status: 'public-domain',
    source: 'test',
    verifiedAt: '2026-10-06T00:00:00Z',
  },
};

const tracks: AudioTrack[] = [
  {
    id: 'track-1',
    bookId: book.id,
    renditionId: rendition.id,
    chapterId: 'chapter-1',
    title: 'Chapter 1',
    durationSec: 100,
    source: {kind: 'remote', uri: 'https://example.test/1.m4a'},
  },
  {
    id: 'track-2',
    bookId: book.id,
    renditionId: rendition.id,
    chapterId: 'chapter-2',
    title: 'Chapter 2',
    durationSec: 200,
    source: {kind: 'remote', uri: 'https://example.test/2.m4a'},
  },
];

const setup = (initialPosition = 0) => {
  const libraryEntries = new Map<string, LibraryEntry>();
  const progressEntries = new Map<string, ListeningProgress>();
  const catalogue: CatalogueRepository = {
    get: async id => (id === book.id ? book : null),
    list: async () => [book],
  };
  const renditions: RenditionRepository = {
    get: async id => (id === rendition.id ? rendition : null),
    listForWork: async id => (id === book.id ? [rendition] : []),
  };
  const library: LibraryRepository = {
    get: async id => libraryEntries.get(id) ?? null,
    list: async () => [...libraryEntries.values()],
    save: async entry => {
      libraryEntries.set(entry.bookId, {...entry});
    },
    remove: async id => {
      libraryEntries.delete(id);
    },
  };
  const progress: ProgressRepository = {
    get: async (bookId, renditionId) =>
      progressEntries.get(`${bookId}:${renditionId}`) ?? null,
    save: async value => {
      progressEntries.set(
        `${value.bookId}:${value.renditionId}`,
        {...value},
      );
    },
  };

  if (initialPosition > 0) {
    progressEntries.set(`${book.id}:${rendition.id}`, {
      bookId: book.id,
      renditionId: rendition.id,
      chapterId: 'chapter-2',
      positionSec: initialPosition,
      durationSec: 300,
    });
  }

  const service = new LibraryService({
    catalogue,
    renditions,
    library,
    progress,
  });
  const engine = new FakeAudioEngine();
  const session = new ChapterPlaybackSession(engine, service);

  return {engine, session, progress, service};
};

describe('ChapterPlaybackSession', () => {
  it('resumes global rendition progress inside the correct chapter', async () => {
    const {engine, session} = setup(150);

    await session.load(book.id, rendition.id, tracks);

    await expect(engine.getSnapshot()).resolves.toMatchObject({
      trackId: 'track-2',
      positionSec: 50,
    });
  });

  it('persists chapter-local playback as global rendition progress', async () => {
    const {engine, session, progress} = setup();

    await session.load(book.id, rendition.id, tracks);
    await engine.skipToTrack('track-2');
    await engine.seekTo(30);
    await session.flush();

    await expect(progress.get(book.id, rendition.id)).resolves.toMatchObject({
      bookId: book.id,
      renditionId: rendition.id,
      chapterId: 'chapter-2',
      positionSec: 130,
      durationSec: 300,
    });
  });

  it('serializes checkpoints when playback events arrive quickly', async () => {
    const {engine, session, progress} = setup();

    await session.load(book.id, rendition.id, tracks);
    await engine.seekTo(10);
    await engine.seekTo(20);
    await engine.seekTo(30);
    await session.flush();

    await expect(progress.get(book.id, rendition.id)).resolves.toMatchObject({
      positionSec: 30,
    });
  });

  it('continues checkpointing after a persistence write fails', async () => {
    const {engine, session, service} = setup();
    const write = jest
      .spyOn(service, 'setPosition')
      .mockRejectedValueOnce(new Error('temporary write failure'))
      .mockResolvedValue(undefined);

    await session.load(book.id, rendition.id, tracks);
    await engine.seekTo(10);
    await expect(session.flush()).rejects.toThrow('temporary write failure');

    await engine.seekTo(20);
    await expect(session.flush()).resolves.toBeUndefined();
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('rejects a queue containing another rendition', async () => {
    const {session} = setup();
    const invalid = [
      tracks[0],
      {...tracks[1], renditionId: 'other-rendition'},
    ];

    await expect(
      session.load(book.id, rendition.id, invalid),
    ).rejects.toThrow('must belong to the same book and rendition');
  });
});
