import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import BookDetailsScreen from '../../app/features/book/BookDetailsScreen';
import BookScreen from '../../app/features/book/BookScreen';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });

const routeFor = (name: string, bookId: string) =>
  ({key: name, name, params: {bookId}} as any);

describe('BookDetailsScreen', () => {
  const setup = async (bookId = 'where-the-crawdads-sing') => {
    const navigation = mockNavigation();
    await renderScreen(
      <BookDetailsScreen
        navigation={navigation}
        route={routeFor('BookDetails', bookId)}
      />,
    );
    return navigation;
  };

  it('shows the book and its key facts', async () => {
    await setup();
    expect(screen.getByText('Details')).toBeOnTheScreen();
    expect(
      screen.getByRole('header', {name: 'Where the Crawdads Sing'}),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Narrated by Cassandra Campbell'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Length 12 h 12 min')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Released \d{4}$/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Rated 4.4 stars')).toBeOnTheScreen();
  });

  it('expands the synopsis', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Read more'}));
    expect(screen.getByRole('button', {name: 'Show less'})).toBeOnTheScreen();
  });

  it('lists genres and the author, narrator, series and language', async () => {
    await setup('fire-blood-hbo-tie-in-edition');
    expect(screen.getByText('Epic')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Author, George R. R. Martin'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Narrator, Simon Vance')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Series, /)).toBeOnTheScreen();
    expect(screen.getByLabelText('Language, English')).toBeOnTheScreen();
  });

  it('leaves out the series row when there is none', async () => {
    await setup();
    expect(screen.queryByLabelText(/^Series, /)).toBeNull();
  });

  it('rates the book', async () => {
    await setup();
    expect(screen.getByText('Tap a star')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: '4 stars'}));
    expect(
      screen.getByRole('button', {name: '4 stars'}),
    ).toHaveAccessibilityState({selected: true});
    expect(
      screen.getByRole('button', {name: '5 stars'}),
    ).toHaveAccessibilityState({selected: false});
    expect(screen.getByText('You rated it 4 stars')).toBeOnTheScreen();
  });

  it('writes a review', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'Write a review'}));
    expect(navigation.navigate).toHaveBeenCalledWith('UpdateCompose', {
      bookId: 'where-the-crawdads-sing',
    });
  });

  it('goes back', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'Back'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

describe('BookScreen', () => {
  it('links to the details', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <BookScreen
        navigation={navigation}
        route={routeFor('Book', 'where-the-crawdads-sing')}
      />,
    );
    await press(screen.getByRole('link', {name: 'About this book'}));
    expect(navigation.navigate).toHaveBeenCalledWith('BookDetails', {
      bookId: 'where-the-crawdads-sing',
    });
  });
});

describe('rating and reviewing together', () => {
  it('carries your rating into the review and saves a new one', async () => {
    const UpdateComposeScreen =
      require('../../app/features/following/UpdateComposeScreen').default;
    await renderScreen(
      <>
        <BookDetailsScreen
          navigation={mockNavigation()}
          route={routeFor('BookDetails', 'where-the-crawdads-sing')}
        />
        <UpdateComposeScreen
          navigation={mockNavigation()}
          route={routeFor('UpdateCompose', 'where-the-crawdads-sing')}
        />
      </>,
    );
    const [detailsFour, composerFour] = screen.getAllByRole('button', {
      name: '4 stars',
    });
    await press(detailsFour);
    expect(composerFour).toHaveAccessibilityState({selected: true});

    const composerFive = screen.getAllByRole('button', {name: '5 stars'})[1];
    await press(composerFive);
    fireEvent.changeText(screen.getByLabelText('Thoughts'), 'Loved it.');
    await press(screen.getByRole('button', {name: 'Post update'}));
    expect(screen.getByText('You rated it 5 stars')).toBeOnTheScreen();
  });
});
