import React from 'react';
import {StatusBar} from 'react-native';
import {screen} from '@testing-library/react-native';

import App from '../App';
import {renderAsync} from './test-utils';

const mockUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

const statusBars = () => screen.UNSAFE_getAllByType(StatusBar);

describe('App', () => {
  beforeEach(() => mockUseColorScheme.mockReturnValue('light'));

  it('renders the main tab bar', async () => {
    await renderAsync(<App />);

    expect(screen.getByText('Discover')).toBeOnTheScreen();
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
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
      expect(statusBars()[0].props).toMatchObject({
        barStyle,
        translucent: true,
        backgroundColor: 'transparent',
      });
    },
  );
});
