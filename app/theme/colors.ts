import tokens from './tokens';

export type ColorScheme = 'light' | 'dark';
export type ColorToken = keyof typeof tokens.colors.light;
export type Palette = Record<ColorToken, string>;

export const colors: Record<ColorScheme, Palette> = tokens.colors;
