import React from 'react';
import {StyleSheet, View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

type ProgressBarProps = {value: number; label: string; height?: number};

export const ProgressBar = ({value, label, height = 4}: ProgressBarProps) => {
  const {colors} = useTheme();
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{min: 0, max: 100, now: Math.round(clamped * 100)}}
      style={[
        styles.track,
        {height, borderRadius: height / 2, backgroundColor: colors.track},
      ]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            borderRadius: height / 2,
            backgroundColor: colors.ink,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {overflow: 'hidden', flexGrow: 1},
  fill: {height: '100%'},
});
