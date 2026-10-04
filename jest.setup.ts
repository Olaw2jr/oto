import '@testing-library/jest-native/extend-expect';
import {AccessibilityInfo} from 'react-native';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
// Mock data loads instantly in tests unless a test opts in.
jest.mock('./app/data/latency', () => ({MOCK_LATENCY_MS: 0}));
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
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
