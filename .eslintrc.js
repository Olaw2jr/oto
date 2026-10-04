module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-shadow': ['error'],
        'no-shadow': 'off',
        'no-undef': 'off',
      },
    },
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
