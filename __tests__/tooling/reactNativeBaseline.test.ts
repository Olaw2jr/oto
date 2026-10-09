/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('React Native 0.87 JavaScript baseline', () => {
  const pkg = JSON.parse(read('package.json'));

  it('pins React Native and React to the 0.87 template line', () => {
    expect(pkg.dependencies['react-native']).toBe('0.87.1');
    expect(pkg.dependencies.react).toBe('19.2.3');
    expect(pkg.devDependencies['react-test-renderer']).toBe('19.2.3');
  });

  it('uses the RN 0.87 toolchain packages', () => {
    expect(pkg.devDependencies['@react-native/babel-preset']).toBe('0.87.1');
    expect(pkg.devDependencies['@react-native/jest-preset']).toBe('0.87.1');
    expect(pkg.devDependencies['@react-native/metro-config']).toBe('0.87.1');
    expect(pkg.devDependencies['@react-native/typescript-config']).toBe('0.87.1');
    expect(pkg.devDependencies['@react-native-community/cli']).toBe('20.2.0');
  });

  it('keeps current product dependencies on compatible lines', () => {
    expect(pkg.dependencies['@react-native-async-storage/async-storage']).toBe('3.1.1');
    expect(pkg.dependencies['@react-native-community/netinfo']).toBe('12.0.1');
    expect(pkg.dependencies['@react-navigation/native']).toBe('7.5.0');
    expect(pkg.dependencies['@react-navigation/bottom-tabs']).toBe('7.20.0');
    expect(pkg.dependencies['@react-navigation/native-stack']).toBe('7.20.0');
    expect(pkg.dependencies['react-native-safe-area-context']).toBe('5.10.1');
    expect(pkg.dependencies['react-native-screens']).toBe('4.28.0');
    expect(pkg.dependencies['react-native-svg']).toBe('15.15.5');
  });

  it('uses modern Babel, Metro, Jest and TypeScript presets', () => {
    expect(read('babel.config.js')).toContain('@react-native/babel-preset');
    expect(read('metro.config.js')).toContain('@react-native/metro-config');
    expect(read('jest.config.js')).toContain('@react-native/jest-preset');
    expect(read('tsconfig.json')).toContain('@react-native/typescript-config');
  });
});
