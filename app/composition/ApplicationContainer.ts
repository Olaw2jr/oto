import {
  PublicDomainPlaybackAssetRepository,
} from '../adapters/catalogue';
import {
  createSeedLibraryGraph,
  ServiceLibraryProviderAdapter,
  ObservableLibraryRepository,
  ObservableProgressRepository,
  seedRenditionId,
  type SeedLibraryGraph,
  type LibraryProviderAdapter,
} from '../adapters/library';
import {
  ChapterPlaybackSession,
  LivePlaybackSession,
  SourceResolver,
  type AudioEngine,
} from '../audio';
import {RightsPolicy} from '../domain/rights';
import {
  PlaybackQueueResolver,
  PlayerController,
  type PlaybackAssetRepository,
  type PlayerSleepTimerController,
} from '../player';
import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
  RenditionRepository,
} from '../repositories';
import {getBook} from '../data/catalogue';
import {LibraryService} from '../services/LibraryService';
import {
  SqliteLibraryRepository,
  SqliteProgressRepository,
  MigrationRunner,
  migrations,
  type SqlDatabase,
} from '../storage/sqlite';
import {
  HttpsTransport,
  LocalFileTransport,
  TransportRegistry,
} from '../transports';

export type ApplicationContainer = {
  repositories: {
    catalogue: CatalogueRepository;
    renditions: RenditionRepository;
    library: LibraryRepository;
    progress: ProgressRepository;
  };
  services: {
    library: LibraryService;
  };
  library: LibraryProviderAdapter;
  audio: {
    createEngine(): Promise<AudioEngine>;
    createPersistentSession(): Promise<ChapterPlaybackSession>;
    createPlayerController(): Promise<PlayerController>;
    createLiveSession(): Promise<LivePlaybackSession>;
    createSleepTimer(): Promise<PlayerSleepTimerController>;
  };
  storage: {
    openDatabase(): Promise<SqlDatabase>;
  };
};

export type ApplicationContainerOptions = {
  playbackAssets?: PlaybackAssetRepository;
  createPlayerController?: () => Promise<PlayerController>;
  libraryGraph?: SeedLibraryGraph;
  databaseFactory?: () => Promise<SqlDatabase>;
};

const openDatabase = async (): Promise<SqlDatabase> => {
  const {openOtoDatabase} = await import('../storage/sqlite/openOtoDatabase');
  return openOtoDatabase();
};

export const createApplicationContainer = (
  options: ApplicationContainerOptions = {},
): ApplicationContainer => {
  const libraryGraph = options.libraryGraph ?? createSeedLibraryGraph();
  const playbackAssets =
    options.playbackAssets ??
    new PublicDomainPlaybackAssetRepository();
  const databaseFactory = options.databaseFactory ?? openDatabase;
  let database: Promise<SqlDatabase> | undefined;
  const sharedDatabase = () => (database ??= databaseFactory());

  const createEngine = async (): Promise<AudioEngine> => {
    const {Platform} = await import('react-native');
    if (Platform.OS === 'android') {
      const {createNativeMedia3AudioEngine} = await import(
        '../adapters/audio/media3/createNativeMedia3AudioEngine'
      );
      return createNativeMedia3AudioEngine();
    }
    const {createNativeRntpAudioEngine} = await import(
      '../audio/rntp/createNativeRntpAudioEngine'
    );
    return createNativeRntpAudioEngine();
  };

  const createPreloader = async () => {
    const {Platform} = await import('react-native');
    const {ChapterPreloadCoordinator} = await import('../audio/preload');
    const backend =
      Platform.OS === 'android'
        ? new (
            await import('../adapters/audio/media3')
          ).Media3PreloadBackend()
        : new (await import('../audio/preload')).QueueAwarePreloadBackend();
    return new ChapterPreloadCoordinator(backend);
  };

  const createPersistentLibraryService = async () => {
    const db = await sharedDatabase();
    const library = new SqliteLibraryRepository(db);
    const progress = new SqliteProgressRepository(db);
    return new LibraryService({
      catalogue: libraryGraph.catalogue,
      renditions: libraryGraph.renditions,
      library,
      progress,
    });
  };

  const createPersistentSession =
    async (): Promise<ChapterPlaybackSession> => {
      const service = await createPersistentLibraryService();
      const engine = await createEngine();
      return new ChapterPlaybackSession(
        engine,
        service,
        await createPreloader(),
      );
    };

  const createSleepTimer =
    async (): Promise<PlayerSleepTimerController> => {
      const {Platform} = await import('react-native');
      if (Platform.OS === 'android') {
        const {Media3SleepTimerController} = await import(
          '../adapters/audio/media3'
        );
        return new Media3SleepTimerController();
      }
      const {createNativeSleepTimerController} = await import(
        '../adapters/audio/createNativeSleepTimerController'
      );
      return createNativeSleepTimerController();
    };

  const createPlayerController =
    async (): Promise<PlayerController> => {
      const service = await createPersistentLibraryService();
      const engine = await createEngine();
      const session = new ChapterPlaybackSession(
        engine,
        service,
        await createPreloader(),
      );
      const sources = new SourceResolver(
        new TransportRegistry([
          new LocalFileTransport(),
          new HttpsTransport({
            start: async () => {
              throw new Error(
                'Direct HTTP downloads are not configured by the player',
              );
            },
          }),
        ]),
        new RightsPolicy('TZ', ['internetarchive']),
        {locate: async () => null},
      );
      const queueResolver = new PlaybackQueueResolver(
        libraryGraph.catalogue,
        libraryGraph.renditions,
        playbackAssets,
        sources,
      );

      return new PlayerController(engine, {
        session,
        queueResolver,
        sleepTimer: await createSleepTimer(),
      });
    };

  return {
    repositories: {
      catalogue: libraryGraph.catalogue,
      renditions: libraryGraph.renditions,
      library: libraryGraph.library,
      progress: libraryGraph.progress,
    },
    services: {
      library: libraryGraph.service,
    },
    library: libraryGraph.adapter,
    audio: {
      createEngine,
      createPersistentSession,
      createPlayerController:
        options.createPlayerController ?? createPlayerController,
      createLiveSession: async () =>
        new LivePlaybackSession(await createEngine()),
      createSleepTimer,
    },
    storage: {
      openDatabase: sharedDatabase,
    },
  };
};

// Hydrate before mounting consumers. SQLite is authoritative; demo seed data is
// only used by explicitly injected test/prototype containers.
export const createPersistentApplicationContainer = async (
  databaseFactory: () => Promise<SqlDatabase> = openDatabase,
): Promise<ApplicationContainer> => {
  const database = await databaseFactory();
  await new MigrationRunner(database, migrations).migrate();
  const seed = createSeedLibraryGraph();
  const storedLibrary = new SqliteLibraryRepository(database);
  const storedProgress = new SqliteProgressRepository(database);
  const library = new ObservableLibraryRepository(await storedLibrary.list());
  const progress = new ObservableProgressRepository();
  for (const entry of library.listSync()) {
    const saved = await storedProgress.get(
      entry.bookId,
      seedRenditionId(entry.bookId),
    );
    if (saved) {
      progress.setOptimistic(saved);
    }
  }
  const durableLibrary: LibraryRepository = {
    get: id => storedLibrary.get(id),
    list: () => storedLibrary.list(),
    save: async entry => {
      await storedLibrary.save(entry);
      library.setOptimistic(entry);
    },
    remove: async id => {
      await storedLibrary.remove(id);
      await library.remove(id);
    },
  };
  const durableProgress: ProgressRepository = {
    get: (bookId, renditionId) => storedProgress.get(bookId, renditionId),
    save: async entry => {
      await storedProgress.save(entry);
      progress.setOptimistic(entry);
    },
  };
  const service = new LibraryService({
    catalogue: seed.catalogue,
    renditions: seed.renditions,
    library: durableLibrary,
    progress: durableProgress,
  });
  const adapter = new ServiceLibraryProviderAdapter(
    service,
    library,
    progress,
    seedRenditionId,
    id => getBook(id).durationSec,
  );
  const container = createApplicationContainer(
    {
      libraryGraph: {...seed, library, progress, service, adapter},
      databaseFactory: async () => database,
    },
  );
  container.repositories.library = durableLibrary;
  container.repositories.progress = durableProgress;
  return container;
};
