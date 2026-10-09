import React from 'react';
import {StyleSheet, View} from 'react-native';
import {act, fireEvent, screen, within} from '@testing-library/react-native';
import {FakeConnectivity} from '../../app/connectivity';

import FollowingScreen from '../../app/features/following/FollowingScreen';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const renderFollowing = async (connectivity?: FakeConnectivity) => {
  const navigation = mockNavigation();
  await renderScreen(
    <FollowingScreen
      navigation={navigation}
      route={{key: 'F', name: 'Following'} as any}
    />,
    {connectivity},
  );
  return navigation;
};
const card = (who: string) => screen.getByTestId(`update-${who}`);
const updateMenu = () =>
  screen
    .UNSAFE_getAllByType(View)
    .find(
      node =>
        node.props.accessibilityRole === 'menu' &&
        node.props.accessibilityLabel === 'Update options',
    );

describe('Following update types', () => {
  it('shows wants-to-listen, rated and made-progress updates', async () => {
    await renderFollowing();
    expect(
      within(card('Daniel K.')).getByText('wants to listen'),
    ).toBeOnTheScreen();
    expect(
      within(card('Daniel K.')).getByText(
        /^George R\. R\. Martin · \d+ h \d+ min$/,
      ),
    ).toBeOnTheScreen();
    expect(within(card('Ren I.')).getByText('rated')).toBeOnTheScreen();
    expect(screen.getByText('made progress')).toBeOnTheScreen();
    expect(screen.getByText(/^\d+ h \d+ min of 6 h 42 min$/)).toBeOnTheScreen();
  });

  it("adds a friend's want to your list", async () => {
    await renderFollowing();
    await press(
      within(card('Daniel K.')).getByRole('button', {
        name: 'Add Fire & Blood (HBO Tie-in Edition)',
      }),
    );
    expect(
      within(card('Daniel K.')).getByText('On your want list'),
    ).toBeOnTheScreen();
  });
});

describe('update menu', () => {
  it('hides an update', async () => {
    await renderFollowing();
    await press(
      within(card('Ren I.')).getByRole('button', {
        name: 'More options for this update',
      }),
    );
    expect(updateMenu()).toBeDefined();
    await press(screen.getByRole('menuitem', {name: 'Hide this update'}));
    expect(screen.queryByTestId('update-Ren I.')).toBeNull();
  });

  it('mutes a person', async () => {
    await renderFollowing();
    const before = screen.getAllByTestId('update-Mika T.').length;
    expect(before).toBeGreaterThan(1);
    await press(
      screen.getAllByRole('button', {name: 'More options for this update'})[0],
    );
    await press(screen.getByRole('menuitem', {name: 'Mute Mika'}));
    expect(screen.queryAllByTestId('update-Mika T.')).toHaveLength(0);
  });

  it('reports an update and confirms it', async () => {
    await renderFollowing();
    await press(
      within(card('Ren I.')).getByRole('button', {
        name: 'More options for this update',
      }),
    );
    await press(screen.getByRole('menuitem', {name: 'Report'}));
    expect(screen.getByText("Thanks. We'll take a look.")).toBeOnTheScreen();
    expect(screen.queryByTestId('update-Ren I.')).toBeNull();
  });
});

describe('undoing mutes and hides from Settings', () => {
  const SettingsScreen =
    require('../../app/features/settings/SettingsScreen').default;
  const renderBoth = async () => {
    await renderScreen(
      <>
        <FollowingScreen
          navigation={mockNavigation()}
          route={{key: 'F', name: 'Following'} as any}
        />
        <SettingsScreen
          navigation={mockNavigation()}
          route={{key: 'S', name: 'Settings'} as any}
        />
      </>,
    );
  };

  it('unmutes a person', async () => {
    await renderBoth();
    expect(screen.getByRole('button', {name: 'Muted people, None'})).toBeOnTheScreen();
    await press(
      screen.getAllByRole('button', {name: 'More options for this update'})[0],
    );
    await press(screen.getByRole('menuitem', {name: 'Mute Mika'}));
    expect(screen.queryAllByTestId('update-Mika T.')).toHaveLength(0);

    await press(screen.getByRole('button', {name: 'Muted people, 1'}));
    await press(screen.getByRole('button', {name: 'Unmute Mika T.'}));
    expect(screen.getAllByTestId('update-Mika T.').length).toBeGreaterThan(0);
  });

  it('shows hidden updates again', async () => {
    await renderBoth();
    await press(
      within(card('Ren I.')).getByRole('button', {
        name: 'More options for this update',
      }),
    );
    await press(screen.getByRole('menuitem', {name: 'Hide this update'}));
    expect(screen.queryByTestId('update-Ren I.')).toBeNull();

    await press(screen.getByRole('button', {name: 'Hidden updates, 1'}));
    await press(screen.getByRole('button', {name: 'Show hidden updates again'}));
    expect(card('Ren I.')).toBeOnTheScreen();
  });
});

describe('Following offline', () => {
  let connectivity: FakeConnectivity;
  beforeEach(() => {
    connectivity = new FakeConnectivity({online: false});
  });
  const renderOffline = () => renderFollowing(connectivity);

  it('explains it is offline and offers the books you downloaded', async () => {
    const {FakeDownloadEngine} = require('../../app/downloads');
    const {PUBLIC_DOMAIN_SAMPLE_ID} = require('../../app/data/catalogue');
    const engine = new FakeDownloadEngine();
    await engine.start({id: 'sample-1', bookId: PUBLIC_DOMAIN_SAMPLE_ID, uri: 'https://x', cacheKey: 'k', title: 'Chapter 1', sizeBytes: 1, wifiOnly: true});
    engine.progress('sample-1', 1, 1, 'completed');
    const navigation = mockNavigation();
    await renderScreen(
      <FollowingScreen navigation={navigation} route={{key: 'F', name: 'Following'} as any} />,
      {connectivity, downloadEngine: engine},
    );
    expect(screen.getByText('You are offline.')).toBeOnTheScreen();
    expect(screen.getByText("Can't reach your friends.")).toBeOnTheScreen();
    expect(screen.queryByTestId('update-Mika T.')).toBeNull();

    expect(screen.getByText('Available offline')).toBeOnTheScreen();
    await press(
      screen.getByRole('button', {name: 'Play The Adventures of Sherlock Holmes'}),
    );
    expect(navigation.navigate).toHaveBeenCalledWith('Player');
  });

  it('says how to listen offline when nothing is downloaded', async () => {
    const navigation = await renderOffline();
    expect(
      screen.getByText('Nothing downloaded yet. Download a book from its page to listen without a connection.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', {name: /^Play /})).toBeNull();
    await press(screen.getByRole('link', {name: 'Downloads'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Downloads');
  });

  it('promises nothing oto cannot do offline', async () => {
    await renderOffline();
    expect(screen.queryByText(/will post/i)).toBeNull();
    expect(screen.queryByText(/still play/i)).toBeNull();
  });

  it('tries again', async () => {
    const refresh = jest.spyOn(connectivity, 'refresh');
    await renderOffline();
    await press(screen.getByRole('button', {name: 'Try again'}));
    expect(refresh).toHaveBeenCalled();
  });

  it('shows the feed again when the connection comes back', async () => {
    await renderOffline();
    await act(async () => connectivity.set({online: true}));
    expect(screen.queryByText('You are offline.')).toBeNull();
    expect(screen.getAllByTestId('update-Mika T.').length).toBeGreaterThan(0);
  });
});

describe('update menu in dark mode', () => {
  it('stands out from the card with a raised colour and an edge', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const {APPEARANCE_STORAGE_KEY} = require('../../app/theme/ThemeProvider');
    const {colors} = require('../../app/theme/colors');
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, 'dark');

    await renderFollowing();
    await press(
      within(card('Ren I.')).getByRole('button', {
        name: 'More options for this update',
      }),
    );

    const menu = StyleSheet.flatten(updateMenu()?.props.style);
    expect(menu.backgroundColor).toBe(colors.dark.raised);
    expect(menu.borderWidth).toBe(1);
    expect(menu.borderColor).toBe(colors.dark.hairline);
    await AsyncStorage.removeItem(APPEARANCE_STORAGE_KEY);
  });
});
