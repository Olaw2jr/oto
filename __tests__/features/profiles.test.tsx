import React from 'react';
import {Text} from 'react-native';
import {act, fireEvent, screen, within} from '@testing-library/react-native';

import AuthorScreen from '../../app/features/profiles/AuthorScreen';
import PersonScreen from '../../app/features/profiles/PersonScreen';
import BookScreen from '../../app/features/book/BookScreen';
import FollowingScreen from '../../app/features/following/FollowingScreen';
import ThreadScreen from '../../app/features/following/ThreadScreen';
import ClubScreen from '../../app/features/club/ClubScreen';
import SearchScreen from '../../app/features/search/SearchScreen';
import {useSocial} from '../../app/state/social';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const route = (name: string, params?: object) =>
  ({key: name, name, params} as any);

describe('PersonScreen', () => {
  const setup = async (personId = 'mika') => {
    const navigation = mockNavigation();
    await renderScreen(
      <PersonScreen
        navigation={navigation}
        route={route('Person', {personId})}
      />,
    );
    return navigation;
  };

  it('shows who they are and what they are listening to', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Mika Tanaka'})).toBeOnTheScreen();
    expect(screen.getByText('@mika')).toBeOnTheScreen();
    expect(screen.getByText('Listening to')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: /^Starry Messenger, 9%/}),
    ).toBeOnTheScreen();
    expect(screen.getByText('Recent updates')).toBeOnTheScreen();
  });

  it('unfollows and follows again', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Unfollow Mika Tanaka'}));
    expect(
      screen.getByRole('button', {name: 'Follow Mika Tanaka'}),
    ).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Follow Mika Tanaka'}));
    expect(
      screen.getByRole('button', {name: 'Unfollow Mika Tanaka'}),
    ).toBeOnTheScreen();
  });

  it('removes people you unfollow from Following', async () => {
    const Unfollow = () => {
      const social = useSocial();
      return (
        <Text onPress={() => social.toggleFollowPerson('mika')}>unfollow</Text>
      );
    };
    await renderScreen(
      <>
        <Unfollow />
        <FollowingScreen
          navigation={mockNavigation()}
          route={route('Following')}
        />
      </>,
    );
    expect(screen.queryAllByTestId('update-Mika T.').length).toBeGreaterThan(0);
    await press(screen.getByText('unfollow'));
    expect(screen.queryAllByTestId('update-Mika T.')).toHaveLength(0);
  });

  it('opens a book they are listening to', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: /^Starry Messenger, 9%/}));
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'starry-messenger',
    });
  });
});

describe('AuthorScreen', () => {
  it('lists their books and can be followed', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <AuthorScreen
        navigation={navigation}
        route={route('Author', {name: 'Andy Weir'})}
      />,
    );
    expect(screen.getByRole('header', {name: 'Andy Weir'})).toBeOnTheScreen();
    expect(screen.getByText('1 audiobook')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Follow Andy Weir'}));
    expect(
      screen.getByRole('button', {name: 'Unfollow Andy Weir'}),
    ).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: /^Project Hail Mary/}));
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'project-hail-mary',
    });
  });
});

describe('ways in', () => {
  it('opens a profile from a feed card', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <FollowingScreen navigation={navigation} route={route('Following')} />,
    );
    await press(
      within(screen.getAllByTestId('update-Zawadi O.')[0]).getByRole('button', {
        name: "Zawadi O.'s profile",
      }),
    );
    expect(navigation.navigate).toHaveBeenCalledWith('Person', {
      personId: 'zawadi',
    });
  });

  it('opens a profile from a thread comment', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <ThreadScreen
        navigation={navigation}
        route={route('Thread', {itemId: 'f2'})}
      />,
    );
    await press(screen.getAllByRole('button', {name: "Mika T.'s profile"})[0]);
    expect(navigation.navigate).toHaveBeenCalledWith('Person', {
      personId: 'mika',
    });
  });

  it('opens a profile from a club post', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <ClubScreen
        navigation={navigation}
        route={route('Club', {clubId: 'quiet-pages'})}
      />,
    );
    await press(screen.getByRole('button', {name: "Zawadi O.'s profile"}));
    expect(navigation.navigate).toHaveBeenCalledWith('Person', {
      personId: 'zawadi',
    });
  });

  it('opens your own profile tab instead of a profile page', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <ThreadScreen
        navigation={navigation}
        route={route('Thread', {itemId: 'f2'})}
      />,
    );
    await press(screen.getByRole('button', {name: 'Your profile'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Tabs', {screen: 'You'});
  });

  it('opens an author from Book', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <BookScreen
        navigation={navigation}
        route={route('Book', {bookId: 'greenlights'})}
      />,
    );
    await press(screen.getByRole('link', {name: 'Matthew McConaughey'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Author', {
      name: 'Matthew McConaughey',
    });
  });

  it('opens an author from Search', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <SearchScreen navigation={navigation} route={route('Search')} />,
    );
    await press(screen.getByRole('button', {name: 'Delia Owens, author'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Author', {
      name: 'Delia Owens',
    });
  });
});
