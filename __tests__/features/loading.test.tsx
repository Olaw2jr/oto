import React from 'react';
import {act, screen} from '@testing-library/react-native';
import {FakeConnectivity} from '../../app/connectivity';

import BookScreen from '../../app/features/book/BookScreen';
import ClubScreen from '../../app/features/club/ClubScreen';
import DiscoverScreen from '../../app/features/discover/DiscoverScreen';
import FollowingScreen from '../../app/features/following/FollowingScreen';
import ThreadScreen from '../../app/features/following/ThreadScreen';
import HomeScreen from '../../app/features/home/HomeScreen';
import CatalogScreen from '../../app/features/library/CatalogScreen';
import LibraryScreen from '../../app/features/library/LibraryScreen';
import YouScreen from '../../app/features/you/YouScreen';
import {resetFirstLoads} from '../../app/state/firstLoad';
import {mockNavigation, renderScreen} from '../test-utils';

// These tests exercise loading, so give mock data a delay.
jest.mock('../../app/data/latency', () => ({MOCK_LATENCY_MS: 700}));

const route = (name: string, params?: object) =>
  ({key: name, name, params} as any);

const cases: [
  string,
  React.ComponentType<any>,
  any,
  string,
  string | RegExp,
][] = [
  [
    'Home',
    HomeScreen,
    route('Home'),
    'Getting your listening ready',
    'Continue listening',
  ],
  [
    'Discover',
    DiscoverScreen,
    route('Discover'),
    'Finding your next listen',
    'Trending with people you follow',
  ],
  [
    'Following',
    FollowingScreen,
    route('Following'),
    'Catching up with friends',
    'He writes about the cosmos like a room you can walk into.',
  ],
  ['Clubs', ClubScreen, route('Clubs'), 'Opening Quiet Pages', 'This month'],
  ['You', YouScreen, route('You'), 'Gathering your shelves', 'Last five weeks'],
  [
    'Book',
    BookScreen,
    route('Book', {bookId: 'greenlights'}),
    'Opening the book',
    'Matthew McConaughey',
  ],
  [
    'Catalog',
    CatalogScreen,
    route('Catalog'),
    'Fetching audiobooks',
    'New releases',
  ],
  [
    'Library',
    LibraryScreen,
    route('Library'),
    'Gathering your shelves',
    'Currently listening',
  ],
  [
    'Thread',
    ThreadScreen,
    route('Thread', {itemId: 'f2'}),
    'Loading the conversation',
    'The ending is so quiet. Did the last chapter get you?',
  ],
];

describe('loading state', () => {
  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
    });
    resetFirstLoads();
  });
  afterEach(() => jest.useRealTimers());

  it.each(cases)(
    '%s shows the oto loading state, then its content',
    async (_, Screen, r, message, content) => {
      await renderScreen(<Screen navigation={mockNavigation()} route={r} />);

      expect(
        screen.getByRole('progressbar', {name: message}),
      ).toBeOnTheScreen();
      expect(screen.getByText(message)).toBeOnTheScreen();
      expect(screen.queryByText(content)).toBeNull();

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.queryByText(message)).toBeNull();
      expect(screen.getAllByText(content).length).toBeGreaterThan(0);
    },
  );

  it('only loads each screen once per session', async () => {
    const view = await renderScreen(
      <HomeScreen navigation={mockNavigation()} route={route('Home')} />,
    );
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    view.unmount();

    await renderScreen(
      <HomeScreen navigation={mockNavigation()} route={route('Home')} />,
    );
    expect(screen.queryByText('Getting your listening ready')).toBeNull();
  });
});

describe('offline illustration', () => {
  it('uses the oto mark', async () => {
    await renderScreen(
      <FollowingScreen
        navigation={mockNavigation()}
        route={route('Following')}
      />,
      {connectivity: new FakeConnectivity({online: false})},
    );
    expect(screen.getByLabelText('oto, offline')).toBeOnTheScreen();
    // Offline, the mark is quiet: no kaki anywhere on the screen.
    const {Circle} = require('react-native-svg');
    const {colors} = require('../../app/theme/colors');
    const fills = screen
      .UNSAFE_getAllByType(Circle)
      .map((c: any) => c.props.fill);
    expect(fills).not.toContain(colors.light.kaki);
    expect(fills).not.toContain(colors.dark.kaki);
  });
});
