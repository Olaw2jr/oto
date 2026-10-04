import {create} from 'tailwind-rn';

import utilities from '../../tailwind.json';
import {colors, ColorScheme} from '../../app/theme/colors';
import {fonts} from '../../app/theme/typography';

const tailwindFor = (colorScheme: ColorScheme) =>
  create(
    utilities as any,
    {
      colorScheme,
      width: 390,
      height: 844,
      orientation: 'portrait',
      reduceMotion: false,
    } as any,
  );

// tailwind-rn resolves colours to rgba() strings at runtime.
const rgba = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, 1)`;
};

describe('tailwind utilities', () => {
  it.each<[ColorScheme]>([['light'], ['dark']])(
    'resolves themed colour pairs in %s mode',
    scheme => {
      const tw = tailwindFor(scheme);
      const palette = colors[scheme];

      expect(tw('bg-paper dark:bg-paper-dark')).toEqual({
        backgroundColor: rgba(palette.paper),
      });
      expect(tw('text-ink dark:text-ink-dark')).toEqual({
        color: rgba(palette.ink),
      });
      expect(tw('text-graphite dark:text-graphite-dark')).toEqual({
        color: rgba(palette.graphite),
      });
      expect(tw('bg-surface dark:bg-surface-dark')).toEqual({
        backgroundColor: rgba(palette.surface),
      });
      expect(tw('bg-kaki dark:bg-kaki-dark')).toEqual({
        backgroundColor: rgba(palette.kaki),
      });
    },
  );

  it.each([
    ['font-sans', fonts.sans.regular],
    ['font-sans-medium', fonts.sans.medium],
    ['font-sans-semibold', fonts.sans.semibold],
    ['font-sans-bold', fonts.sans.bold],
    ['font-serif', fonts.serif.medium],
  ])('%s uses the %s font file', (name, fontFamily) => {
    expect(tailwindFor('light')(name)).toEqual({fontFamily});
  });
});
