const {colors, fonts} = require('./app/theme/tokens');

// `bg-paper` / `dark:bg-paper-dark` style pairs for every token.
const themeColors = Object.fromEntries(
  Object.keys(colors.light).map(token => [
    token,
    {DEFAULT: colors.light[token], dark: colors.dark[token]},
  ]),
);

module.exports = {
  mode: 'jit',
  content: ['./App.tsx', './app/**/*.{ts,tsx}'],
  safelist: [
    {
      pattern: new RegExp(
        `^(bg|text|border)-(${Object.keys(colors.light).join('|')})(-dark)?$`,
      ),
      variants: ['dark'],
    },
    {pattern: /^font-(sans|serif)(-.+)?$/},
  ],
  theme: {
    extend: {
      colors: themeColors,
      fontFamily: {
        sans: [fonts.sans.regular],
        'sans-medium': [fonts.sans.medium],
        'sans-semibold': [fonts.sans.semibold],
        'sans-bold': [fonts.sans.bold],
        serif: [fonts.serif.medium],
      },
    },
  },
  plugins: [],
  corePlugins: require('tailwind-rn/unsupported-core-plugins'),
};
