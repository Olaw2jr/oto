import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';
import {Txt} from './Txt';

type Option<T extends string> = {value: T; label: string};

type SegmentedProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export const Segmented = <T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>) => {
  const {colors, colorScheme} = useTheme();
  const selectedBg = colorScheme === 'dark' ? colors.switchOff : colors.surface;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.track, {backgroundColor: colors.segment}]}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{checked: selected}}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && [styles.selected, {backgroundColor: selectedBg}],
            ]}>
            <Txt
              variant="caption"
              color={selected ? 'ink' : 'graphite'}
              weight={selected ? 'semibold' : 'medium'}
              style={styles.text}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 44,
    padding: 3,
    borderRadius: 14,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  selected: {
    shadowColor: '#1B1B19',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  text: {fontSize: 13.5},
});
