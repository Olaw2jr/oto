module.exports = {
  mode: 'jit',
  content: ['./App.tsx', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
  corePlugins: require('tailwind-rn/unsupported-core-plugins'),
};
