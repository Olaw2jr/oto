import React, {ReactNode} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';
import {Icon} from './Icon';

type CheckboxProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
};

export const Checkbox = ({label, value, onChange, children}: CheckboxProps) => {
  const {colors} = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{checked: value}}
      onPress={() => onChange(!value)}
      style={styles.row}>
      <View
        style={[
          styles.box,
          {borderColor: colors.ink},
          value && {backgroundColor: colors.ink},
        ]}>
        {value ? (
          <Icon name="check" size={16} color="onInk" strokeWidth={2.4} />
        ) : null}
      </View>
      <View style={styles.text}>{children}</View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', minHeight: 56},
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  text: {flex: 1},
});
