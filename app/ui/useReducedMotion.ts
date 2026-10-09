import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';

// Whether the system asks for less motion. Null until known, so animations
// don't start and then stop.
export const useReducedMotion = (): boolean | null => {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => active && setReduced(Boolean(value)))
      .catch(() => active && setReduced(false));
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => setReduced(Boolean(value)),
    );
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);
  return reduced;
};
