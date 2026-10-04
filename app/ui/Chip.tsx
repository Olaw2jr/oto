import React from 'react';
import {Pressable, StyleSheet} from 'react-native';

import {Pill} from './Pill';

type ChipProps = {label: string; selected?: boolean; onPress: () => void};

export const Chip = ({label, selected = false, onPress}: ChipProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{selected}}
    onPress={onPress}
    style={styles.hit}>
    <Pill
      label={label}
      fontSize={14}
      color={selected ? 'onInk' : 'ink'}
      background={selected ? 'ink' : undefined}
      border={selected ? 'ink' : 'switchOff'}
    />
  </Pressable>
);

const styles = StyleSheet.create({
  hit: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 3},
});
