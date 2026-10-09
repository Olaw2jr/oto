import {PublicDomainPlaybackAssetRepository} from '../adapters/catalogue';
import {
  createSeedLibraryGraph,
  InMemoryCollectionsRepository,
  ServiceLibraryProviderAdapter,
  ObservableLibraryRepository,
  ObservableProgressRepository,
  seedRenditionId,
  type SeedLibraryGraph,
  type LibraryProviderAdapter,
} from '../adapters/library';
import {NetInfoConnectivity} from '../adapters/connectivity';
import {
  ChapterPlaybackSession,
  LivePlaybackSession,
  SourceResolver,
  type AudioEngine,
  type ChapterPreloadCoordinator,
} from '../audio';
import type {PersonalCollections} from '../domain';
import {ApiClient, FetchHttpTransport} from '../api';
import {apiBaseUrl} from '../config/environment';
import type {Connectivity} from '../connectivity';
import {
  InMemoryTelemetryStore,
  QueuedTelemetry,
  TelemetryUploader,
  type Telemetry,
  type TelemetryStore,
} from '../telemetry';
import {RightsPolicy} from '../domain/rights';
import {
  PlaybackQueueResolver,
  PlayerController,
  type PlaybackAssetRepository,
  type PlayerSleepTimerController,
} from '../player';
import type {
  CatalogueRepository,
  CollectionsRepository,
  LibraryRepository,
  ProgressRepository,
  RenditionRepository,
} from '../repositories';
import {getBook} from '../data/catalogue';
import {shelvesSeed} from '../data/social';
import {LibraryService} from '../services/LibraryService';
import {
  SqliteCollectionsRepository,
  SqliteLibraryRepository,
  SqliteMutationOutbox,
  SqliteProgressRepository,
  SqliteTelemetryStore,
  MigrationRunner,
  migrations,
  type SqlDatabase,
} from '../storage/sqlite';
import {InMemoryMutationOutbox, type MutationOutbox} from '../sync';
import {
  HttpsTransport,
  LocalFileTransport,
  TransportRegistry,
  type ContentTransport,
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
  // Ratings, your shelves and bookmarks, loaded before the UI mounts.
  collections: {
    repository: CollectionsRepository;
    initial: PersonalCollections;
  };
  sync: {
    // Changes waiting for the server. Nothing sends them until a backend
    // transport exists (BE-06).
    outbox: MutationOutbox;
  };
  connectivity: Connectivity;
  telemetry: {
    telemetry: Telemetry;
    store: TelemetryStore;
    // Resolves once recorded events are stored (tests and shutdown).
    idle(): Promise<void>;
    // Uploads to the backend's telemetry endpoint when one is configured.
    start(): () => void;
  };
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
  createTorrentStreamingTransport?: () => Promise<ContentTransport | undefined>;
  createAudioEngine?: () => Promise<AudioEngine>;
  createPreloader?: () => Promise<ChapterPreloadCoordinator | undefined>;
  createSleepTimerController?: () => Promise<PlayerSleepTimerController>;
  collections?: ApplicationContainer['collections'];
  outbox?: MutationOutbox;
  connectivity?: Connectivity;
  telemetryStore?: TelemetryStore;
  apiBaseUrl?: string | null;
};

const createTelemetry = (
  store: TelemetryStore,
  connectivity: Connectivity,
  baseUrl: string | null,
): ApplicationContainer['telemetry'] => {
  const telemetry = new QueuedTelemetry(store);
  return {
    telemetry,
    store,
    idle: () => telemetry.idle(),
    start: () => {
      if (!baseUrl) return () => {};
      return new TelemetryUploader({
        store,
        connectivity,
        api: new ApiClient(new FetchHttpTransport(baseUrl)),
        schedule: (run, delayMs) => {
          const timer = setTimeout(run, delayMs);
          return () => clearTimeout(timer);
        },
      }).start();
    },
  };
};

const createSeedCollections = (): ApplicationContainer['collections'] => {
  const repository = new InMemoryCollectionsRepository({
    ratings: {},
    shelves: shelvesSeed,
    bookmarks: {},
  });
  return {repository, initial: repository.snapshot()};
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
    options.playbackAssets ?? new PublicDomainPlaybackAssetRepository();
  const databaseFactory = options.databaseFactory ?? openDatabase;
  let database: Promise<SqlDatabase> | undefined;
  const sharedDatabase = () => (database ??= databaseFactory());
  const createTorrentStreamingTransport =
    options.createTorrentStreamingTransport ??
    (async (): Promise<ContentTransport | undefined> => {
      const {Platform} = await import('react-native');
      if (Platform.OS !== 'android') return undefined;
      const {createAndroidTorrentRuntime} = await import('../adapters/torrent');
      return createAndroidTorrentRuntime().streaming;
    });

  const createEngine =
    options.createAudioEngine ??
    (async (): Promise<AudioEngine> => {
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
    });

  const createPreloader =
    options.createPreloader ??
    (async () => {
      const {Platform} = await import('react-native');
      const {ChapterPreloadCoordinator} = await import('../audio/preload');
      const backend =
        Platform.OS === 'android'
          ? new (
              await import('../adapters/audio/media3')
            ).Media3PreloadBackend()
          : new (await import('../audio/preload')).QueueAwarePreloadBackend();
      return new ChapterPreloadCoordinator(backend);
    });

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

  const createPersistentSession = async (): Promise<ChapterPlaybackSession> => {
    const service = await createPersistentLibraryService();
    const engine = await createEngine();
    return new ChapterPlaybackSession(engine, service, await createPreloader());
  };

  const createSleepTimer =
    options.createSleepTimerController ??
    (async (): Promise<PlayerSleepTimerController> => {
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
    });

  const createPlayerController = async (): Promise<PlayerController> => {
    const service = await createPersistentLibraryService();
    const engine = await createEngine();
    const session = new ChapterPlaybackSession(
      engine,
      service,
      await createPreloader(),
    );
    const transports: ContentTransport[] = [
      new LocalFileTransport(),
      new HttpsTransport({
        start: async () => {
          throw new Error(
            'Direct HTTP downloads are not configured by the player',
          );
        },
      }),
    ];
    const torrentTransport = await createTorrentStreamingTransport();
    if (torrentTransport) transports.push(torrentTransport);
    const sources = new SourceResolver(
      new TransportRegistry(transports),
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

  const connectivity = options.connectivity ?? new NetInfoConnectivity();
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
    collections: options.collections ?? createSeedCollections(),
    sync: {outbox: options.outbox ?? new InMemoryMutationOutbox()},
    connectivity,
    telemetry: createTelemetry(
      options.telemetryStore ?? new InMemoryTelemetryStore(),
      connectivity,
      options.apiBaseUrl === undefined ? apiBaseUrl : options.apiBaseUrl,
    ),
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
  const storedCollections = new SqliteCollectionsRepository(database);
  const collections = {
    repository: storedCollections,
    initial: await storedCollections.load(),
  };
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
  const container = createApplicationContainer({
    libraryGraph: {...seed, library, progress, service, adapter},
    databaseFactory: async () => database,
    collections,
    outbox: new SqliteMutationOutbox(database),
    telemetryStore: new SqliteTelemetryStore(database),
  });
  container.repositories.library = durableLibrary;
  container.repositories.progress = durableProgress;
  return container;
};
