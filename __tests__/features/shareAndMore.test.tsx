import React from 'react';
import {Share} from 'react-native';
import {act, fireEvent, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BookScreen from '../../app/features/book/BookScreen';
import ClubScreen from '../../app/features/club/ClubScreen';
import DiscoverScreen from '../../app/features/discover/DiscoverScreen';
import MoodScreen from '../../app/features/discover/MoodScreen';
import ThreadScreen from '../../app/features/following/ThreadScreen';
import PlayerScreen from '../../app/features/player/PlayerScreen';
import SettingsScreen from '../../app/features/settings/SettingsScreen';
import {SETTINGS_STORAGE_KEY} from '../../app/state/settings';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const route = (name: string, params?: object) =>
  ({key: name, name, params} as any);

let share: jest.SpyInstance;
beforeEach(async () => {
  await AsyncStorage.clear();
  share = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({action: 'sharedAction'} as any);
});
afterEach(() => share.mockRestore());

describe('sharing', () => {
  it('shares a book from Book', async () => {
    await renderScreen(
      <BookScreen
        navigation={mockNavigation()}
        route={route('Book', {bookId: 'greenlights'})}
      />,
    );
    await press(screen.getByRole('button', {name: 'Share'}));
    expect(share).toHaveBeenCalledWith({
      message: 'Greenlights by Matthew McConaughey. Listening on oto.',
    });
  }, 15000);

  it('shares from the Player More sheet', async () => {
    await renderScreen(
      <PlayerScreen navigation={mockNavigation()} route={route('Player')} />,
    );
    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Share'}));
    expect(share).toHaveBeenCalledWith({
      message: expect.stringMatching(/^Where the Crawdads Sing by Delia Owens/),
    });
  });
});

describe('More menus', () => {
  it('Book: share, save to a list and details', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <BookScreen
        navigation={navigation}
        route={route('Book', {bookId: 'greenlights'})}
      />,
    );
    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Details'}));
    expect(navigation.navigate).toHaveBeenCalledWith('BookDetails', {
      bookId: 'greenlights',
    });
  });

  it('Club: share the club and change notifications', async () => {
    await renderScreen(
      <ClubScreen
        navigation={mockNavigation()}
        route={route('Club', {clubId: 'quiet-pages'})}
      />,
    );
    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Share club'}));
    expect(share).toHaveBeenCalledWith({
      message: expect.stringContaining('Quiet Pages'),
    });

    // Sharing closes the sheet; reopen it for notifications.
    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Notifications'}));
    await press(screen.getByRole('radio', {name: 'Nothing'}));
    expect(
      JSON.parse((await AsyncStorage.getItem(SETTINGS_STORAGE_KEY))!),
    ).toMatchObject({
      notifications: 'none',
    });
  });

  it('Thread: share and report', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <ThreadScreen
        navigation={navigation}
        route={route('Thread', {itemId: 'f2'})}
      />,
    );
    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Share update'}));
    expect(share).toHaveBeenCalledWith({
      message: expect.stringContaining('Tuesdays with Morrie'),
    });

    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Report'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

describe('Discover filters and moods', () => {
  it('filters picks by chip', async () => {
    await renderScreen(
      <DiscoverScreen
        navigation={mockNavigation()}
        route={route('Discover')}
      />,
    );
    await press(screen.getByRole('button', {name: 'Short listens'}));
    expect(
      screen.getByRole('header', {name: 'Short listens'}),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: /^Tuesdays with Morrie/}),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', {name: /^Fire & Blood/})).toBeNull();

    await press(screen.getByRole('button', {name: 'For you'}));
    expect(
      screen.getByText('Trending with people you follow'),
    ).toBeOnTheScreen();
  });

  it('opens a mood', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <DiscoverScreen navigation={navigation} route={route('Discover')} />,
    );
    await press(screen.getByRole('button', {name: 'Long drive'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Mood', {
      mood: 'Long drive',
    });
  });

  it('lists long books for a long drive', async () => {
    await renderScreen(
      <MoodScreen
        navigation={mockNavigation()}
        route={route('Mood', {mood: 'Long drive'})}
      />,
    );
    expect(screen.getByRole('header', {name: 'Long drive'})).toBeOnTheScreen();
    expect(
      screen.getByText('Twelve hours or more, for the open road.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: /^Fire & Blood/}),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', {name: /^Tuesdays with Morrie/}),
    ).toBeNull();
  });
});

describe('Settings sheets', () => {
  const setup = () =>
    renderScreen(
      <SettingsScreen
        navigation={mockNavigation()}
        route={route('Settings')}
      />,
    );

  it('chooses skip intervals and the player uses them', async () => {
    await renderScreen(
      <>
        <SettingsScreen
          navigation={mockNavigation()}
          route={route('Settings')}
        />
        <PlayerScreen navigation={mockNavigation()} route={route('Player')} />
      </>,
    );
    await press(
      screen.getByRole('button', {name: 'Skip back and forward, 15 s · 30 s'}),
    );
    await press(screen.getByRole('radio', {name: '10 s · 10 s'}));
    expect(
      screen.getByRole('button', {name: 'Skip back and forward, 10 s · 10 s'}),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: 'Back 10 seconds'}),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: 'Forward 10 seconds'}),
    ).toBeOnTheScreen();
  });

  it('chooses notifications', async () => {
    await setup();
    await press(
      screen.getByRole('button', {name: 'Notifications, Club sessions'}),
    );
    await press(screen.getByRole('radio', {name: 'Everything'}));
    expect(
      screen.getByRole('button', {name: 'Notifications, Everything'}),
    ).toBeOnTheScreen();
  });
});
