module.exports = {
  preset: '@react-native/jest-preset',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native[^/]*|@react-native(-community)?|@react-navigation)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    'test-utils',
  ],
};
