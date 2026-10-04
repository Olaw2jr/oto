import React from 'react';
import {Pressable, StyleSheet} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';
import {Txt} from './Txt';

type ChipProps = {label: string; selected?: boolean; onPress: () => void};

export const Chip = ({label, selected = false, onPress}: ChipProps) => {
  const {colors} = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected}}
      onPress={onPress}
      style={styles.hit}>
      <Txt
        variant="caption"
        color={selected ? 'onInk' : 'ink'}
        weight="medium"
        style={[
          styles.pill,
          {borderColor: selected ? colors.ink : colors.switchOff},
          selected && {backgroundColor: colors.ink},
        ]}>
        {label}
      </Txt>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  hit: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 3},
  pill: {
    height: 34,
    lineHeight: 32,
    paddingHorizontal: 15,
    borderRadius: 17,
    borderWidth: 1,
    fontSize: 14,
    overflow: 'hidden',
  },
});
