import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {colors, ColorScheme, Palette} from './colors';

export type AppearancePreference = 'system' | 'light' | 'dark';

export const APPEARANCE_STORAGE_KEY = 'oto.appearance';

const preferences: AppearancePreference[] = ['system', 'light', 'dark'];

type ThemeContextValue = {
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
  colorScheme: ColorScheme;
  colors: Palette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({children}: {children: ReactNode}) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<AppearancePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)
      .then(stored => {
        if (preferences.includes(stored as AppearancePreference)) {
          setPreferenceState(stored as AppearancePreference);
        }
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((next: AppearancePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, next).catch(() => {});
  }, []);

  const colorScheme: ColorScheme =
    preference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      colorScheme,
      colors: colors[colorScheme],
    }),
    [preference, setPreference, colorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return value;
};
