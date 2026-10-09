import React from 'react';
import {Text} from 'react-native';
import {act, fireEvent, screen} from '@testing-library/react-native';

import CatalogScreen from '../../app/features/library/CatalogScreen';
import LibraryScreen from '../../app/features/library/LibraryScreen';
import SaveToShelfScreen from '../../app/features/library/SaveToShelfScreen';
import ShelfScreen from '../../app/features/library/ShelfScreen';
import HomeScreen from '../../app/features/home/HomeScreen';
import YouScreen from '../../app/features/you/YouScreen';
import {useLibrary} from '../../app/state/library';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const route = (name: string, params?: object) =>
  ({key: name, name, params} as any);

describe('CatalogScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <CatalogScreen navigation={navigation} route={route('Catalog')} />,
    );
    return navigation;
  };
  const titles = () =>
    screen
      .getAllByRole('button', {name: /^Open /})
      .map(b => b.props.accessibilityLabel);

  it('lists new releases first, newest at the top', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Audiobooks'})).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: 'New releases'}),
    ).toHaveAccessibilityState({selected: true});
    expect(titles().length).toBeGreaterThan(5);
  });

  it('sorts by rating on Top rated', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Top rated'}));
    expect(titles()[0]).toBe('Open Project Hail Mary');
  });

  it("shows editors' picks", async () => {
    await setup();
    await press(screen.getByRole('button', {name: "Editors' picks"}));
    expect(titles()).toEqual([
      'Open Where the Crawdads Sing',
      'Open Tuesdays with Morrie',
      'Open The Silmarillion',
      'Open Greenlights',
    ]);
  });

  it('shows rating, length and genre and opens a book', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: "Editors' picks"}));
    expect(
      screen.getByText('4.4 · 12 h 12 min · Coming of Age'),
    ).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Open Greenlights'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'greenlights',
    });
  });

  it('is reached from Home', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <HomeScreen navigation={navigation} route={route('Home')} />,
    );
    await press(screen.getByRole('link', {name: 'See all audiobooks'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Catalog');
  });
});

describe('LibraryScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <LibraryScreen navigation={navigation} route={route('Library')} />,
    );
    return navigation;
  };

  it('shows what you are listening to with time listened', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Library'})).toBeOnTheScreen();
    expect(screen.getByText('Currently listening')).toBeOnTheScreen();
    expect(screen.getByText(/^3 h 2\d min of 12 h 12 min$/)).toBeOnTheScreen();
  });

  it('lists shelves with counts and opens one', async () => {
    const navigation = await setup();
    expect(screen.getByText('4 shelves')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: 'Want to listen, 1 book'}),
    ).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Quiet nights, 2 books'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Shelf', {
      shelfId: 'quiet-nights',
    });
  });

  it('creates a shelf', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'New shelf'}));
    fireEvent.changeText(screen.getByLabelText('Shelf name'), 'Road trips');
    await press(screen.getByRole('button', {name: 'Create shelf'}));
    expect(
      screen.getByRole('button', {name: 'Road trips, 0 books'}),
    ).toBeOnTheScreen();
    expect(screen.getByText('5 shelves')).toBeOnTheScreen();
  });

  it('is reached from You', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <YouScreen navigation={navigation} route={route('You')} />,
    );
    await press(screen.getByRole('link', {name: 'Library'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Library');
  });
});

describe('ShelfScreen', () => {
  it('lists the books on a shelf', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <ShelfScreen
        navigation={navigation}
        route={route('Shelf', {shelfId: 'quiet-nights'})}
      />,
    );
    expect(
      screen.getByRole('header', {name: 'Quiet nights'}),
    ).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: /^Tuesdays with Morrie/}));
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'tuesdays-with-morrie',
    });
  });

  it('shows the empty state with a way to find a book', async () => {
    const navigation = mockNavigation();
    // The Silmarillion is the only book you want; start listening to it.
    const Listen = () => {
      const library = useLibrary();
      return (
        <Text
          onPress={() => library.setStatus('the-silmarillion', 'listening')}>
          listen
        </Text>
      );
    };
    await renderScreen(
      <>
        <Listen />
        <ShelfScreen
          navigation={navigation}
          route={route('Shelf', {shelfId: 'want'})}
        />
      </>,
    );
    expect(
      screen.getByRole('header', {name: 'Want to listen'}),
    ).toBeOnTheScreen();
    await press(screen.getByText('listen'));

    expect(screen.getByText('Nothing here yet.')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Find a book'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Tabs', {
      screen: 'Discover',
    });
  });
});

describe('ShelfScreen editing', () => {
  const open = async (shelfId = 'quiet-nights') => {
    const navigation = mockNavigation();
    await renderScreen(
      <ShelfScreen navigation={navigation} route={route('Shelf', {shelfId})} />,
    );
    return navigation;
  };

  it('removes a book from your shelf', async () => {
    await open();
    await press(
      screen.getByRole('button', {name: 'Remove Tuesdays with Morrie from Quiet nights'}),
    );
    expect(screen.queryByRole('button', {name: /^Tuesdays with Morrie/})).toBeNull();
  });

  it('renames your shelf', async () => {
    await open();
    await press(screen.getByRole('button', {name: 'Shelf options'}));
    await press(screen.getByRole('button', {name: 'Rename'}));
    fireEvent.changeText(screen.getByLabelText('Shelf name'), 'Sleepy listens');
    await press(screen.getByRole('button', {name: 'Save'}));
    expect(screen.getByRole('header', {name: 'Sleepy listens'})).toBeOnTheScreen();
  });

  it('deletes your shelf after you confirm', async () => {
    const navigation = await open();
    await press(screen.getByRole('button', {name: 'Shelf options'}));
    await press(screen.getByRole('button', {name: 'Delete shelf'}));
    expect(screen.getByText('Delete Quiet nights? The books stay in your library.')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Delete'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('leaves Want to listen and Finished alone', async () => {
    await open('want');
    expect(screen.queryByRole('button', {name: 'Shelf options'})).toBeNull();
    expect(screen.queryAllByRole('button', {name: /^Remove /})).toHaveLength(0);
  });
});

describe('SaveToShelfScreen', () => {
  it('adds a book to shelves and makes a new one', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <SaveToShelfScreen
        navigation={navigation}
        route={route('SaveToShelf', {bookId: 'greenlights'})}
      />,
    );
    expect(screen.getByText('Save to a list')).toBeOnTheScreen();

    const quiet = screen.getByRole('checkbox', {name: 'Quiet nights'});
    expect(quiet).toHaveAccessibilityState({checked: false});
    await press(quiet);
    expect(
      screen.getByRole('checkbox', {name: 'Quiet nights'}),
    ).toHaveAccessibilityState({checked: true});

    await press(screen.getByRole('button', {name: 'New shelf'}));
    fireEvent.changeText(screen.getByLabelText('Shelf name'), 'Memoirs');
    await press(screen.getByRole('button', {name: 'Create shelf'}));
    expect(
      screen.getByRole('checkbox', {name: 'Memoirs'}),
    ).toHaveAccessibilityState({checked: true});

    await press(screen.getByRole('button', {name: 'Done'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
