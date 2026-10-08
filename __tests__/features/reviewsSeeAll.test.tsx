import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import BookScreen from '../../app/features/book/BookScreen';
import ReviewsScreen from '../../app/features/book/ReviewsScreen';
import {mockNavigation, renderScreen} from '../test-utils';

// Three reviews of one book, so the Book screen has more than it previews.
jest.mock('../../app/data/social', () => {
  const actual = jest.requireActual('../../app/data/social');
  const extra = ['mika', 'daniel'].map((by, i) => ({
    id: `extra-${i}`,
    bookId: 'where-the-crawdads-sing',
    by,
    rating: 4,
    body: `Review ${i}`,
    likes: 0,
    comments: 0,
  }));
  return {...actual, reviews: [...actual.reviews, ...extra]};
});

const routeFor = (name: string) =>
  ({key: name, name, params: {bookId: 'where-the-crawdads-sing'}} as any);

describe('Book reviews See all', () => {
  it('previews two reviews and opens the rest', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <BookScreen navigation={navigation} route={routeFor('Book')} />,
    );
    expect(screen.getAllByLabelText(/ rated it \d/)).toHaveLength(2);
    await act(async () => {
      fireEvent.press(screen.getByRole('link', {name: 'See all 3 reviews'}));
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Reviews', {
      bookId: 'where-the-crawdads-sing',
    });
  });

  it('lists them all on the Reviews screen', async () => {
    await renderScreen(
      <ReviewsScreen navigation={mockNavigation()} route={routeFor('Reviews')} />,
    );
    expect(screen.getAllByLabelText(/ rated it \d/)).toHaveLength(3);
  });
});
