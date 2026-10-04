import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import HomeScreen from '../../../app/features/home/HomeScreen';
import {dayGreeting} from '../../../app/data/time';
import {mockNavigation, renderScreen} from '../../test-utils';

const route = {key: 'Home', name: 'Home'} as any;

describe('dayGreeting', () => {
  it.each([
    [new Date(2026, 9, 4, 7), 'Sunday morning', 'Good morning'],
    [new Date(2026, 9, 5, 14), 'Monday afternoon', 'Good afternoon'],
    [new Date(2026, 9, 6, 20), 'Tuesday evening', 'Good evening'],
    [new Date(2026, 9, 6, 2), 'Tuesday night', 'Good evening'],
  ])('%s', (date, label, hello) => {
    expect(dayGreeting(date)).toEqual({label, hello});
  });
});

describe('HomeScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(<HomeScreen navigation={navigation} route={route} />);
    return navigation;
  };

  it('greets Amani', async () => {
    await setup();
    expect(
      screen.getByRole('header', {name: /^Good \w+, Amani\.$/}),
    ).toBeOnTheScreen();
  });

  it('offers to continue the current book', async () => {
    const navigation = await setup();
    expect(screen.getByText('Continue listening')).toBeOnTheScreen();
    expect(
      screen.getAllByText('Where the Crawdads Sing').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/^Chapter \d+ · \d+ h \d{2} min left$/),
    ).toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {name: 'Resume Where the Crawdads Sing'}),
      );
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Player');
  });

  it('shows the live club session and joins it', async () => {
    const navigation = await setup();
    expect(screen.getByText('Live now')).toBeOnTheScreen();
    expect(
      screen.getByText('Quiet Pages is listening to Where the Crawdads Sing'),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', {name: /Join Quiet Pages/}));
    expect(navigation.navigate).toHaveBeenCalledWith('Club', {
      clubId: 'quiet-pages',
    });
  });

  it('recommends books after a finished one', async () => {
    const navigation = await setup();
    expect(
      screen.getByRole('header', {name: 'Because you finished Atomic Habits'}),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', {name: 'Project Hail Mary'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'project-hail-mary',
    });
  });

  it("shows a friend's latest finish", async () => {
    await setup();
    expect(screen.getByText('Mika T.')).toBeOnTheScreen();
    expect(
      screen.getByText('Quiet, devastating, perfectly paced.'),
    ).toBeOnTheScreen();
  });

  it('opens your profile', async () => {
    const navigation = await setup();
    fireEvent.press(screen.getByRole('button', {name: 'Your profile'}));
    expect(navigation.navigate).toHaveBeenCalledWith('You');
  });
});
