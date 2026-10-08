import {createApplicationContainer} from '../../app/composition';
import {FakeAudioEngine} from '../../app/audio';
import {PUBLIC_DOMAIN_SAMPLE_CHAPTERS, PUBLIC_DOMAIN_SAMPLE_ID} from '../../app/data/catalogue';
import type {ContentTransport} from '../../app/transports';
import type {SqlDatabase} from '../../app/storage/sqlite';
import {LibraryService} from '../../app/services/LibraryService';

describe('application composition root', () => {
  it('assembles catalogue, library service and provider adapter in one graph', () => {
    const container = createApplicationContainer();

    expect(container.services.library).toBeInstanceOf(LibraryService);
    expect(container.repositories.catalogue).toBeDefined();
    expect(container.repositories.renditions).toBeDefined();
    expect(container.repositories.library).toBeDefined();
    expect(container.repositories.progress).toBeDefined();
    expect(container.library).toBeDefined();
    expect(container.audio.createPlayerController).toEqual(
      expect.any(Function),
    );
    expect(container.storage.openDatabase).toEqual(expect.any(Function));
  });

  it('creates isolated container state per application root', () => {
    const first = createApplicationContainer();
    const second = createApplicationContainer();

    first.library.setPosition('starry-messenger', 123);

    expect(first.library.positionSec('starry-messenger')).toBe(123);
    expect(second.library.positionSec('starry-messenger')).not.toBe(123);
  });

  it('allows tests to replace the lazy player-controller factory', async () => {
    const createPlayerController = jest.fn(async () => null as never);
    const container = createApplicationContainer({createPlayerController});

    await container.audio.createPlayerController();

    expect(createPlayerController).toHaveBeenCalledTimes(1);
  });

  it('routes authorized torrent assets through the production player resolver', async () => {
    const prepared: string[] = [];
    const torrent: ContentTransport = {
      kind: 'torrent',
      canHandle: source => source.kind === 'torrent',
      prepare: async source => {
        if (source.kind !== 'torrent') throw new Error('Expected torrent');
        prepared.push(source.filePath ?? '');
        return {
          uri: 'http://127.0.0.1:43123/media/test-token',
          transport: 'torrent',
        };
      },
    };
    const database = {
      execute: async () => ({rows: []}),
      query: async () => [],
      transaction: async (work: (tx: unknown) => Promise<unknown>) =>
        work(database),
    } as unknown as SqlDatabase;
    const container = createApplicationContainer({
      databaseFactory: async () => database,
      createAudioEngine: async () => new FakeAudioEngine(),
      createPreloader: async () => undefined,
      createSleepTimerController: async () => ({
        setMinutes: async () => {},
        setEndOfChapter: async () => {},
        clear: async () => {},
        getState: async () => null,
      }),
      createTorrentStreamingTransport: async () => torrent,
      playbackAssets: {
        listForRendition: async renditionId =>
          PUBLIC_DOMAIN_SAMPLE_CHAPTERS.map((_, index) => {
            const filePath = `adventuresholmes_${String(index + 1).padStart(2, '0')}_doyle_64kb.mp3`;
            return {
              chapterId: `${PUBLIC_DOMAIN_SAMPLE_ID}:chapter-${index + 1}`,
              asset: {
                id: `${renditionId}:${index}`,
                renditionId,
                format: 'mp3',
                sources: [
                  {
                    kind: 'torrent' as const,
                    torrentUri: 'https://archive.org/sample.torrent',
                    filePath,
                    trustedSourceId: 'internetarchive',
                  },
                ],
              },
            };
          }),
      },
    });

    const player = await container.audio.createPlayerController();
    await player.loadBook(PUBLIC_DOMAIN_SAMPLE_ID);

    expect(prepared).toHaveLength(PUBLIC_DOMAIN_SAMPLE_CHAPTERS.length);
    expect(prepared[0]).toBe('adventuresholmes_01_doyle_64kb.mp3');
  });
});
