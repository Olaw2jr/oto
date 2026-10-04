import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DiscoverScreen from '../../app/features/discover/DiscoverScreen';
import SearchScreen, {
  RECENT_SEARCHES_KEY,
} from '../../app/features/search/SearchScreen';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });

beforeEach(() => AsyncStorage.clear());

describe('DiscoverScreen search entry', () => {
  it('opens Search from the search field', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <DiscoverScreen
        navigation={navigation}
        route={{key: 'D', name: 'Discover'} as any}
      />,
    );
    await press(screen.getByRole('search', {name: 'Search'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Search');
  });
});

describe('SearchScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <SearchScreen
        navigation={navigation}
        route={{key: 'S', name: 'Search'} as any}
      />,
    );
    return navigation;
  };
  const search = (text: string) =>
    act(async () => {
      fireEvent.changeText(screen.getByLabelText('Search'), text);
    });

  it('shows recent searches, authors for you and a pick before you type', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Recent'})).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: 'Search for crawdads'}),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('header', {name: 'Authors for you'}),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('header', {name: 'Because you finished Atomic Habits'}),
    ).toBeOnTheScreen();
  });

  it('follows an author', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Follow Andy Weir'}));
    expect(
      screen.getByRole('button', {name: 'Unfollow Andy Weir'}),
    ).toBeOnTheScreen();
  });

  it('searches across titles, authors and narrators', async () => {
    const navigation = await setup();
    await search('ray porter');
    await press(
      screen.getByRole('button', {name: /^Project Hail Mary, Andy Weir/}),
    );
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'project-hail-mary',
    });
  });

  it('narrows results by scope', async () => {
    await setup();
    await search('weir');
    await press(screen.getByRole('button', {name: 'Narrators'}));
    expect(screen.getByText('No narrators match “weir”.')).toBeOnTheScreen();

    await press(screen.getByRole('button', {name: 'Authors'}));
    expect(
      screen.getByRole('button', {name: /^Project Hail Mary/}),
    ).toBeOnTheScreen();
  });

  it('finds clubs', async () => {
    const navigation = await setup();
    await search('quiet');
    await press(screen.getByRole('button', {name: 'Clubs'}));
    await press(screen.getByRole('button', {name: /^Quiet Pages/}));
    expect(navigation.navigate).toHaveBeenCalledWith('Club', {
      clubId: 'quiet-pages',
    });
  });

  it('remembers what you searched for', async () => {
    await setup();
    await search('tolkien');
    await act(async () => {
      fireEvent(screen.getByLabelText('Search'), 'submitEditing');
    });
    expect(
      JSON.parse((await AsyncStorage.getItem(RECENT_SEARCHES_KEY))!)[0],
    ).toBe('tolkien');

    await search('');
    expect(
      screen.getByRole('button', {name: 'Search for tolkien'}),
    ).toBeOnTheScreen();
  });

  it('runs a recent search and clears them', async () => {
    await setup();
    await press(
      screen.getByRole('button', {name: 'Search for Project Hail Mary'}),
    );
    expect(screen.getByLabelText('Search')).toHaveProp(
      'value',
      'Project Hail Mary',
    );

    await search('');
    await press(screen.getByRole('button', {name: 'Clear recent searches'}));
    expect(screen.queryByRole('header', {name: 'Recent'})).toBeNull();
  });

  it('removes one recent search', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Remove crawdads'}));
    expect(
      screen.queryByRole('button', {name: 'Search for crawdads'}),
    ).toBeNull();
  });

  it('cancels', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'Cancel'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
