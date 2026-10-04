module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['__tests__/**', 'jest.setup.ts'],
      env: {jest: true},
    },
    {
      files: ['scripts/**', '*.config.js'],
      env: {node: true},
    },
  ],
};
