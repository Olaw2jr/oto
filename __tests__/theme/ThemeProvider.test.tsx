import React from 'react';
import {Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  APPEARANCE_STORAGE_KEY,
  ThemeProvider,
  useTheme,
} from '../../app/theme/ThemeProvider';
import {colors} from '../../app/theme/colors';

const mockUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

const Probe = () => {
  const {preference, colorScheme, colors: palette, setPreference} = useTheme();
  return (
    <>
      <Text testID="state">{`${preference}/${colorScheme}/${palette.paper}`}</Text>
      <Text onPress={() => setPreference('dark')}>Dark</Text>
      <Text onPress={() => setPreference('system')}>System</Text>
    </>
  );
};

const renderProvider = async () => {
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  await act(async () => {});
};

const state = () => screen.getByTestId('state').props.children;

beforeEach(async () => {
  await AsyncStorage.clear();
  mockUseColorScheme.mockReturnValue('light');
});

describe('ThemeProvider', () => {
  it('follows the system colour scheme by default', async () => {
    mockUseColorScheme.mockReturnValue('dark');
    await renderProvider();

    expect(state()).toBe(`system/dark/${colors.dark.paper}`);
  });

  it('treats an unknown system scheme as light', async () => {
    mockUseColorScheme.mockReturnValue(null);
    await renderProvider();

    expect(state()).toBe(`system/light/${colors.light.paper}`);
  });

  it('lets an explicit preference override the system', async () => {
    await renderProvider();

    await act(async () => {
      fireEvent.press(screen.getByText('Dark'));
    });

    expect(state()).toBe(`dark/dark/${colors.dark.paper}`);
  });

  it('saves the preference and restores it on the next launch', async () => {
    await renderProvider();
    await act(async () => {
      fireEvent.press(screen.getByText('Dark'));
    });
    expect(await AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark');

    screen.unmount();
    await renderProvider();

    expect(state()).toBe(`dark/dark/${colors.dark.paper}`);
  });

  it('ignores an invalid stored value', async () => {
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, 'sepia');
    await renderProvider();

    expect(state()).toBe(`system/light/${colors.light.paper}`);
  });
});
