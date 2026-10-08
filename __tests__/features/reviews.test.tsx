import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import ReviewsScreen from '../../app/features/book/ReviewsScreen';
import {mockNavigation, renderScreen} from '../test-utils';

const routeFor = (bookId: string) =>
  ({key: 'Reviews', name: 'Reviews', params: {bookId}} as any);

describe('ReviewsScreen', () => {
  const setup = async (bookId = 'where-the-crawdads-sing') => {
    const navigation = mockNavigation();
    await renderScreen(
      <ReviewsScreen navigation={navigation} route={routeFor(bookId)} />,
    );
    return navigation;
  };

  it('lists every review of the book from people you follow', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Reviews'})).toBeOnTheScreen();
    expect(screen.getByText('Where the Crawdads Sing')).toBeOnTheScreen();
    expect(screen.getAllByLabelText(/ rated it \d/)).toHaveLength(1);
  });

  it('opens a reviewer', async () => {
    const navigation = await setup('project-hail-mary');
    const [first] = screen.getAllByRole('button', {name: /'s profile$/});
    await act(async () => {
      fireEvent.press(first);
    });
    expect(navigation.navigate).toHaveBeenCalledWith(
      'Person',
      expect.objectContaining({personId: expect.any(String)}),
    );
  });

  it('includes ratings people you follow posted', async () => {
    await setup('tuesdays-with-morrie');
    expect(screen.getByLabelText('Zawadi O. rated it 4.5')).toBeOnTheScreen();
  });

  it('goes back', async () => {
    const navigation = await setup();
    fireEvent.press(screen.getByRole('button', {name: 'Back'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
