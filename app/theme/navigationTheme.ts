import {DarkTheme, DefaultTheme, Theme} from '@react-navigation/native';

import {colors, ColorScheme} from './colors';

export const navigationTheme = (scheme: ColorScheme): Theme => {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const palette = colors[scheme];

  return {
    ...base,
    colors: {
      primary: palette.ink,
      background: palette.paper,
      card: palette.paper,
      text: palette.ink,
      border: palette.hairline,
      notification: palette.kaki,
    },
  };
};
