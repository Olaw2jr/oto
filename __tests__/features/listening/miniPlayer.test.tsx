import React from 'react';
import {fireEvent, screen} from '@testing-library/react-native';
import {useNavigation} from '@react-navigation/native';

import {MiniPlayer} from '../../../app/components/MiniPlayer';
import {renderScreen} from '../../test-utils';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
}));

describe('MiniPlayer', () => {
  it('shows the current book and opens the player', async () => {
    const navigate = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({navigate});
    await renderScreen(<MiniPlayer />);

    expect(
      screen.getByText(/^Chapter \d+ · \d+ h \d{2} min left$/),
    ).toBeOnTheScreen();
    fireEvent.press(
      screen.getByRole('button', {
        name: 'Open player: Where the Crawdads Sing, paused',
      }),
    );
    expect(navigate).toHaveBeenCalledWith('Player');
  });

  it('plays and pauses in place', async () => {
    (useNavigation as jest.Mock).mockReturnValue({navigate: jest.fn()});
    await renderScreen(<MiniPlayer />);

    fireEvent.press(screen.getByRole('button', {name: 'Play'}));
    expect(
      await screen.findByRole('button', {
        name: 'Open player: Where the Crawdads Sing, playing',
      }),
    ).toBeOnTheScreen();
  });
});
