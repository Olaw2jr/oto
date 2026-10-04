import '@testing-library/jest-native/extend-expect';
import {AccessibilityInfo} from 'react-native';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// RN's jest mock returns undefined from these, but tailwind-rn awaits them.
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
