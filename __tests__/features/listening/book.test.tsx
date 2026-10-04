import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import BookScreen from '../../../app/features/book/BookScreen';
import {mockNavigation, renderScreen} from '../../test-utils';

const routeFor = (bookId: string) =>
  ({key: 'Book', name: 'Book', params: {bookId}} as any);

describe('BookScreen', () => {
  const setup = async (bookId = 'where-the-crawdads-sing') => {
    const navigation = mockNavigation();
    await renderScreen(
      <BookScreen navigation={navigation} route={routeFor(bookId)} />,
    );
    return navigation;
  };

  it('shows the book, its rating and length', async () => {
    await setup();
    expect(
      screen.getByRole('header', {name: 'Where the Crawdads Sing'}),
    ).toBeOnTheScreen();
    expect(screen.getByText('Delia Owens')).toBeOnTheScreen();
    expect(
      screen.getByText('4.4 · 2,184 ratings · 12 h 12 min'),
    ).toBeOnTheScreen();
  });

  it('resumes where you are and opens the player', async () => {
    const navigation = await setup();
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {name: /^Resume · \d+ h \d+ min in$/}),
      );
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Player');
  });

  it('offers to start a book you have not begun', async () => {
    await setup('project-hail-mary');
    expect(screen.getByRole('button', {name: 'Listen'})).toBeOnTheScreen();
  });

  it('changes your status', async () => {
    await setup();
    expect(
      screen.getByRole('radio', {name: 'Listening'}),
    ).toHaveAccessibilityState({
      checked: true,
    });
    fireEvent.press(screen.getByRole('radio', {name: 'Finished'}));
    expect(
      screen.getByRole('radio', {name: 'Finished'}),
    ).toHaveAccessibilityState({
      checked: true,
    });
  });

  it('shows who you follow is listening and their reviews', async () => {
    await setup();
    expect(
      screen.getByText('Mika, Zawadi and 7 others are listening'),
    ).toBeOnTheScreen();
    expect(screen.getByText('From people you follow')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Ends quietly and stays with you. The second half is the whole book.',
      ),
    ).toBeOnTheScreen();
  });

  it('keeps the narrator, genre and synopsis from the original app', async () => {
    await setup();
    expect(
      screen.getByText('Narrated by Cassandra Campbell'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('header', {name: 'About'})).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', {name: 'Read more'}));
    expect(screen.getByRole('button', {name: 'Show less'})).toBeOnTheScreen();
  });

  it('goes back', async () => {
    const navigation = await setup();
    fireEvent.press(screen.getByRole('button', {name: 'Back'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
