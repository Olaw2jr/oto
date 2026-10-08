import {
  PublicDomainPlaybackAssetRepository,
} from '../adapters/catalogue';
import {
  createSeedLibraryGraph,
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
import {LibraryService} from '../services/LibraryService';
import {
  SqliteLibraryRepository,
  SqliteProgressRepository,
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
};

const openDatabase = async (): Promise<SqlDatabase> => {
  const {openOtoDatabase} = await import('../storage/sqlite/openOtoDatabase');
  return openOtoDatabase();
};

export const createApplicationContainer = (
  options: ApplicationContainerOptions = {},
): ApplicationContainer => {
  const libraryGraph = createSeedLibraryGraph();
  const playbackAssets =
    options.playbackAssets ??
    new PublicDomainPlaybackAssetRepository();

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
    const database = await openDatabase();
    const library = new SqliteLibraryRepository(database);
    const progress = new SqliteProgressRepository(database);
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
      openDatabase,
    },
  };
};
