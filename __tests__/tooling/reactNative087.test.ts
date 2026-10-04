/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('React Native 0.87 JavaScript baseline', () => {
  const pkg = JSON.parse(read('package.json'));

  it('pins the React Native 0.87 runtime pair', () => {
    expect(pkg.dependencies.react).toBe('19.2.3');
    expect(pkg.dependencies['react-native']).toBe('0.87.0');
    expect(pkg.devDependencies['react-test-renderer']).toBe('19.2.3');
    expect(pkg.devDependencies['@types/react']).toBe('^19.2.0');
    expect(pkg.devDependencies['@types/react-native']).toBeUndefined();
  });

  it('uses the React Native 0.87 toolchain packages', () => {
    [
      '@react-native/babel-preset',
      '@react-native/eslint-config',
      '@react-native/jest-preset',
      '@react-native/metro-config',
      '@react-native/typescript-config',
    ].forEach(name => expect(pkg.devDependencies[name]).toBe('0.87.0'));

    expect(pkg.devDependencies['@react-native-community/cli']).toBe('20.2.0');
    expect(pkg.devDependencies['@react-native-community/cli-platform-android']).toBe(
      '20.2.0',
    );
    expect(pkg.devDependencies['@react-native-community/cli-platform-ios']).toBe(
      '20.2.0',
    );
  });

  it('uses current React Native config entry points', () => {
    expect(read('babel.config.js')).toContain('@react-native/babel-preset');
    expect(read('metro.config.js')).toContain('@react-native/metro-config');
    expect(JSON.parse(read('tsconfig.json')).extends).toBe(
      '@react-native/typescript-config',
    );
    expect(read('jest.config.js')).toContain("@react-native/jest-preset");
    expect(read('.eslintrc.js')).toContain("extends: '@react-native'");
  });

  it('uses React 19-compatible testing utilities', () => {
    expect(pkg.devDependencies['@testing-library/react-native']).toBe('13.3.3');
    expect(pkg.devDependencies['@testing-library/jest-native']).toBeUndefined();
    expect(read('jest.setup.ts')).toContain(
      "import '@testing-library/react-native/extend-expect';",
    );
  });
});
