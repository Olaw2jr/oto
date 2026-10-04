import {navigationTheme} from '../../app/theme/navigationTheme';
import {colors} from '../../app/theme/colors';

describe('navigationTheme', () => {
  it.each(['light', 'dark'] as const)(
    'maps %s tokens onto React Navigation',
    scheme => {
      const theme = navigationTheme(scheme);
      const palette = colors[scheme];

      expect(theme.dark).toBe(scheme === 'dark');
      expect(theme.colors).toEqual({
        primary: palette.ink,
        background: palette.paper,
        card: palette.paper,
        text: palette.ink,
        border: palette.hairline,
        notification: palette.kaki,
      });
    },
  );
});
