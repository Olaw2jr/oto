import React from 'react';
import {StatusBar} from 'react-native';
import {screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import App from '../App';
import {SESSION_STORAGE_KEY} from '../app/state/session';
import {renderAsync} from './test-utils';

const mockUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

const statusBars = () => screen.UNSAFE_getAllByType(StatusBar);

describe('App', () => {
  beforeEach(async () => {
    mockUseColorScheme.mockReturnValue('light');
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({signedIn: true, hasOnboarded: true}),
    );
  });

  it('renders the main tab bar for a signed-in listener', async () => {
    await renderAsync(<App />);

    expect(screen.getByRole('tab', {name: 'Discover'})).toBeOnTheScreen();
  });

  it.each([
    ['light', 'dark-content'],
    ['dark', 'light-content'],
  ])(
    'uses one %s-scheme status bar with %s icons',
    async (scheme, barStyle) => {
      mockUseColorScheme.mockReturnValue(scheme);
      await renderAsync(<App />);

      expect(statusBars()).toHaveLength(1);
      expect(statusBars()[0].props).toMatchObject({barStyle});
    },
  );
});
