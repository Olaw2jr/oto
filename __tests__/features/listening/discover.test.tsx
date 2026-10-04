import React from 'react';
import {fireEvent, screen} from '@testing-library/react-native';

import DiscoverScreen from '../../../app/features/discover/DiscoverScreen';
import {mockNavigation, renderScreen} from '../../test-utils';

const route = {key: 'Discover', name: 'Discover'} as any;

describe('DiscoverScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <DiscoverScreen navigation={navigation} route={route} />,
    );
    return navigation;
  };

  it('has a search field and filters', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Discover'})).toBeOnTheScreen();
    expect(
      screen.getByPlaceholderText('Titles, authors, clubs, people'),
    ).toBeOnTheScreen();

    const forYou = screen.getByRole('button', {name: 'For you'});
    expect(forYou).toHaveAccessibilityState({selected: true});
    fireEvent.press(screen.getByRole('button', {name: 'Short listens'}));
    expect(
      screen.getByRole('button', {name: 'Short listens'}),
    ).toHaveAccessibilityState({
      selected: true,
    });
  });

  it('ranks what people you follow are listening to', async () => {
    const navigation = await setup();
    expect(
      screen.getByText('Mika, Zawadi and 5 others listening'),
    ).toBeOnTheScreen();
    fireEvent.press(
      screen.getByRole('button', {name: /^1\. The Silmarillion/}),
    );
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'the-silmarillion',
    });
  });

  it('adds a trending book to want to listen', async () => {
    await setup();
    fireEvent.press(
      screen.getByRole('button', {
        name: 'Add Project Hail Mary to want to listen',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: 'Project Hail Mary is on your want list',
      }),
    ).toBeOnTheScreen();
  });

  it('searches titles and authors', async () => {
    const navigation = await setup();
    fireEvent.changeText(screen.getByLabelText('Search'), 'weir');

    expect(screen.queryByText('Trending with people you follow')).toBeNull();
    fireEvent.press(
      screen.getByRole('button', {name: /^Project Hail Mary, Andy Weir/}),
    );
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'project-hail-mary',
    });
  });

  it('says so when nothing matches', async () => {
    await setup();
    fireEvent.changeText(screen.getByLabelText('Search'), 'zzzz');
    expect(screen.getByText('No books match “zzzz”.')).toBeOnTheScreen();
  });

  it('lists moods', async () => {
    await setup();
    for (const mood of [
      'Quiet evening',
      'Long drive',
      'Commute',
      'Falling asleep',
    ]) {
      expect(screen.getByRole('button', {name: mood})).toBeOnTheScreen();
    }
  });
});
