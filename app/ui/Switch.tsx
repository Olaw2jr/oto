import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

type SwitchProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  small?: boolean;
};

export const Switch = ({
  label,
  value,
  onChange,
  small = false,
}: SwitchProps) => {
  const {colors} = useTheme();
  const width = small ? 38 : 46;
  const height = small ? 22 : 28;
  const knob = height - 6;
  const knobLeft = value ? width - knob - 3 : 3;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{checked: value}}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      onPress={() => onChange(!value)}
      style={[
        styles.track,
        {
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: value ? colors.ink : colors.switchOff,
        },
      ]}>
      <View
        style={[
          styles.knob,
          {
            width: knob,
            height: knob,
            borderRadius: knob / 2,
            left: knobLeft,
            backgroundColor: value ? colors.onInk : colors.surface,
          },
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {justifyContent: 'center'},
  knob: {
    position: 'absolute',
    top: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    elevation: 2,
  },
});
