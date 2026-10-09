import React, {ReactElement} from 'react';
import {act, render} from '@testing-library/react-native';

import {createSeedLibraryGraph} from '../app/adapters/library';
import {
  FakeAudioEngine,
  SourceResolver,
} from '../app/audio';
import {
  InMemorySleepTimerStore,
  SleepTimerController,
} from '../app/audio/sleep';
import {RightsPolicy} from '../app/domain/rights';
import {
  PlaybackQueueResolver,
  PlayerController,
  type PlaybackAssetRepository,
} from '../app/player';
import {
  createApplicationContainer,
  type ApplicationContainerOptions,
} from '../app/composition';
import {FakeConnectivity} from '../app/connectivity';
import {ThemeProvider} from '../app/theme/ThemeProvider';
import {AppProviders} from '../app/state/AppProviders';
import {
  FakeContentTransport,
  TransportRegistry,
} from '../app/transports';

export const createTestPlayerController = async (): Promise<PlayerController> => {
  const graph = createSeedLibraryGraph();
  const renditions = {
    get: async (id: string) => {
      const rendition = await graph.renditions.get(id);
      return rendition
        ? {
            ...rendition,
            rights: {
              status: 'user-owned' as const,
              source: 'test',
              verifiedAt: '2026-10-07T00:00:00.000Z',
            },
          }
        : null;
    },
    listForWork: async (bookId: string) => {
      const values = await graph.renditions.listForWork(bookId);
      return values.map(rendition => ({
        ...rendition,
        rights: {
          status: 'user-owned' as const,
          source: 'test',
          verifiedAt: '2026-10-07T00:00:00.000Z',
        },
      }));
    },
  };
  const assets: PlaybackAssetRepository = {
    listForRendition: async renditionId => {
      const rendition = await renditions.get(renditionId);
      return (
        rendition?.chapters.map(chapter => ({
          chapterId: chapter.id,
          asset: {
            id: `test:${chapter.id}`,
            renditionId,
            format: 'mp3' as const,
            sources: [
              {
                kind: 'local' as const,
                uri: `file:///test/${chapter.id}.mp3`,
              },
            ],
          },
        })) ?? []
      );
    },
  };
  const queueResolver = new PlaybackQueueResolver(
    graph.catalogue,
    renditions,
    assets,
    new SourceResolver(
      new TransportRegistry([new FakeContentTransport('local')]),
      new RightsPolicy('TZ', []),
      {locate: async () => null},
    ),
  );
  return new PlayerController(new FakeAudioEngine(), {
    queueResolver,
    sleepTimer: new SleepTimerController(
      new InMemorySleepTimerStore(),
    ),
  });
};

export const createTestContainer = (
  options: ApplicationContainerOptions = {},
) =>
  createApplicationContainer({
    createPlayerController: createTestPlayerController,
    connectivity: new FakeConnectivity(),
    ...options,
  });

// The providers resolve stored state asynchronously after mount;
// flush those updates so tests don't trip act() warnings.
export const renderAsync = async (ui: ReactElement) => {
  const result = render(ui);
  await act(async () => {});
  return result;
};

export const renderWithTheme = (ui: ReactElement) =>
  renderAsync(<ThemeProvider>{ui}</ThemeProvider>);

// Options replace parts of the test container, e.g. an offline connectivity.
export const renderScreen = (
  ui: ReactElement,
  options: Partial<ApplicationContainerOptions> = {},
) =>
  renderAsync(
    <AppProviders
      container={createTestContainer(
        Object.fromEntries(
          Object.entries(options).filter(([, value]) => value !== undefined),
        ),
      )}>
      {ui}
    </AppProviders>,
  );

// A navigation prop stand-in for screen tests.
export const mockNavigation = () =>
  ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    canGoBack: jest.fn(() => true),
  } as any);
