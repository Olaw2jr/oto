import {colors, ColorScheme} from '../../app/theme/colors';

// WCAG 2.x relative luminance and contrast ratio.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const schemes: ColorScheme[] = ['light', 'dark'];

describe('colors', () => {
  it('matches the oto brand palette from the design canvas', () => {
    expect(colors.light).toMatchObject({
      paper: '#F7F6F2',
      ink: '#1B1B19',
      surface: '#FFFFFF',
      tonal: '#E6E3DA',
      graphite: '#66655F',
      kaki: '#BF3E27',
    });
    expect(colors.dark).toMatchObject({
      paper: '#121211',
      ink: '#F1EFE8',
      surface: '#1D1D1B',
      graphite: '#A3A199',
      kaki: '#E0543A',
    });
  });

  it('defines the same tokens in both schemes', () => {
    expect(Object.keys(colors.dark).sort()).toEqual(
      Object.keys(colors.light).sort(),
    );
  });

  it.each(schemes)('keeps button text readable on ink in %s mode', scheme => {
    const {ink, onInk} = colors[scheme];
    expect(contrast(onInk, ink)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(schemes)('keeps body text at 4.5:1 or more in %s mode', scheme => {
    const {paper, surface, ink, graphite} = colors[scheme];
    for (const bg of [paper, surface]) {
      expect(contrast(ink, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(graphite, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
