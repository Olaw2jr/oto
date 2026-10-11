import '@testing-library/jest-native/extend-expect';
import {AccessibilityInfo} from 'react-native';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
// Mock data loads instantly in tests unless a test opts in.
// Native secure storage and Google sign-in; tests inject fakes where it matters.
jest.mock('react-native-keychain', () => {
  const saved = new Map<string, string>();
  return {
    ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly'},
    getGenericPassword: async ({service}: {service: string}) =>
      saved.has(service)
        ? {username: 'oto', password: saved.get(service)}
        : false,
    setGenericPassword: async (
      _: string,
      password: string,
      {service}: {service: string},
    ) => {
      saved.set(service, password);
      return true;
    },
    resetGenericPassword: async ({service}: {service: string}) =>
      saved.delete(service),
  };
});
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({type: 'cancelled', data: null})),
    signOut: jest.fn(async () => null),
  },
}));
jest.mock('./app/data/latency', () => ({MOCK_LATENCY_MS: 0}));
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest').default,
);

// RN's jest mock returns undefined from these; make them resolve like the
// real module.
(
  [
    'isBoldTextEnabled',
    'isGrayscaleEnabled',
    'isInvertColorsEnabled',
    'isReduceMotionEnabled',
    'isReduceTransparencyEnabled',
  ] as const
).forEach(method => {
  (AccessibilityInfo[method] as jest.Mock).mockResolvedValue(false);
});

// Native persistence is covered with real SQLite integration tests. UI tests
// explicitly substitute the isolated in-memory application graph.
jest.mock('./app/composition', () => {
  const actual = jest.requireActual('./app/composition');
  return {
    ...actual,
    createPersistentApplicationContainer: async () =>
      actual.createApplicationContainer(),
  };
});
