import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import PlayerScreen from '../../../app/features/player/PlayerScreen';
import {mockNavigation, renderScreen} from '../../test-utils';

const route = {key: 'Player', name: 'Player'} as any;

describe('PlayerScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(<PlayerScreen navigation={navigation} route={route} />);
    return navigation;
  };

  it('shows the book and who you are listening with', async () => {
    await setup();
    expect(screen.getByText('Listening with')).toBeOnTheScreen();
    expect(screen.getByText('Quiet Pages')).toBeOnTheScreen();
    expect(
      screen.getByRole('header', {name: 'Where the Crawdads Sing'}),
    ).toBeOnTheScreen();
    expect(screen.getByText(/^Chapter \d+$/)).toBeOnTheScreen();
    expect(screen.getByText(/^−\d+:\d{2}:\d{2}$/)).toBeOnTheScreen();
  });

  it('plays, pauses and skips', async () => {
    await setup();
    const elapsed = () => screen.getByLabelText('Elapsed').props.children;

    fireEvent.press(screen.getByRole('button', {name: 'Play'}));
    await screen.findByRole('button', {name: 'Pause'});
    fireEvent.press(screen.getByRole('button', {name: 'Pause'}));
    await screen.findByRole('button', {name: 'Play'});
    const start = elapsed();

    fireEvent.press(screen.getByRole('button', {name: 'Forward 30 seconds'}));
    await screen.findByText('0:30');
    expect(elapsed()).not.toBe(start);
    fireEvent.press(screen.getByRole('button', {name: 'Back 15 seconds'}));
    await screen.findByText('0:15');
    fireEvent.press(screen.getByRole('button', {name: 'Back 15 seconds'}));
    await screen.findByText('0:00');
  });

  it('cycles the playback speed', async () => {
    await setup();
    fireEvent.press(
      screen.getByRole('button', {name: 'Playback speed 1 times'}),
    );
    expect(
      await screen.findByRole('button', {name: 'Playback speed 1.25 times'}),
    ).toBeOnTheScreen();
    expect(screen.getByText('1.25×')).toBeOnTheScreen();
  });

  it('shows margin notes near the current moment', async () => {
    await setup();
    expect(screen.getByText('Margin notes · here')).toBeOnTheScreen();
    expect(screen.getByText('3 notes')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Read this passage twice. It changes everything that came before.',
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: /^Add a note at \d+:\d{2}:\d{2}$/}),
    ).toBeOnTheScreen();
  });

  it('closes', async () => {
    const navigation = await setup();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', {name: 'Close player'}));
    });
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
