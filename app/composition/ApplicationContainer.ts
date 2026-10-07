import {
  createSeedLibraryGraph,
  type LibraryProviderAdapter,
} from '../adapters/library';
import type {
  CatalogueRepository,
  LibraryRepository,
  ProgressRepository,
  RenditionRepository,
} from '../repositories';
import {ChapterPlaybackSession, type AudioEngine} from '../audio';
import {LibraryService} from '../services/LibraryService';
import {
  SqliteLibraryRepository,
  SqliteProgressRepository,
  type SqlDatabase,
} from '../storage/sqlite';

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
  };
  storage: {
    openDatabase(): Promise<SqlDatabase>;
  };
};

const openDatabase = async (): Promise<SqlDatabase> => {
  const {openOtoDatabase} = await import('../storage/sqlite/openOtoDatabase');
  return openOtoDatabase();
};

export const createApplicationContainer = (): ApplicationContainer => {
  const libraryGraph = createSeedLibraryGraph();

  const createEngine = async (): Promise<AudioEngine> => {
    const {createNativeRntpAudioEngine} = await import(
      '../audio/rntp/createNativeRntpAudioEngine'
    );
    return createNativeRntpAudioEngine();
  };

  const createPersistentSession =
    async (): Promise<ChapterPlaybackSession> => {
      const database = await openDatabase();
      const library = new SqliteLibraryRepository(database);
      const progress = new SqliteProgressRepository(database);
      const service = new LibraryService({
        catalogue: libraryGraph.catalogue,
        renditions: libraryGraph.renditions,
        library,
        progress,
      });
      return new ChapterPlaybackSession(await createEngine(), service);
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
    },
    storage: {
      openDatabase,
    },
  };
};
