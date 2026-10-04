import React from 'react';
import {act, fireEvent, screen, within} from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';

import FollowingScreen from '../../app/features/following/FollowingScreen';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const renderFollowing = async () => {
  const navigation = mockNavigation();
  await renderScreen(
    <FollowingScreen
      navigation={navigation}
      route={{key: 'F', name: 'Following'} as any}
    />,
  );
  return navigation;
};
const card = (who: string) => screen.getByTestId(`update-${who}`);

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
    expect(
      screen.getByRole('menu', {name: 'Update options'}),
    ).toBeOnTheScreen();
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

describe('Following offline', () => {
  beforeEach(() => {
    (NetInfo.useNetInfo as jest.Mock).mockReturnValue({
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
    });
  });
  afterEach(() => {
    (NetInfo.useNetInfo as jest.Mock).mockReturnValue({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    });
  });

  it('explains it is offline and offers what still plays', async () => {
    const navigation = await renderFollowing();
    expect(screen.getByText('You are offline.')).toBeOnTheScreen();
    expect(screen.getByText("Can't reach your friends.")).toBeOnTheScreen();
    expect(screen.queryByTestId('update-Mika T.')).toBeNull();

    expect(screen.getByText('Available offline')).toBeOnTheScreen();
    await press(
      screen.getByRole('button', {name: /^Play Where the Crawdads Sing/}),
    );
    expect(navigation.navigate).toHaveBeenCalledWith('Player');
  });

  it('tries again', async () => {
    await renderFollowing();
    await press(screen.getByRole('button', {name: 'Try again'}));
    expect(NetInfo.refresh).toHaveBeenCalled();
  });
});

describe('update menu in dark mode', () => {
  it('stands out from the card with a raised colour and an edge', async () => {
    const {StyleSheet} = require('react-native');
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

    const menu = StyleSheet.flatten(
      screen.getByRole('menu', {name: 'Update options'}).props.style,
    );
    expect(menu.backgroundColor).toBe(colors.dark.raised);
    expect(menu.borderWidth).toBe(1);
    expect(menu.borderColor).toBe(colors.dark.hairline);
    await AsyncStorage.removeItem(APPEARANCE_STORAGE_KEY);
  });
});
