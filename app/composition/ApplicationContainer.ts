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
import type {AudioEngine} from '../audio';
import type {LibraryService} from '../services/LibraryService';
import type {SqlDatabase} from '../storage/sqlite';

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
      createEngine: async () => {
        const {createNativeRntpAudioEngine} = await import(
          '../audio/rntp/createNativeRntpAudioEngine'
        );
        return createNativeRntpAudioEngine();
      },
    },
    storage: {
      openDatabase,
    },
  };
};
