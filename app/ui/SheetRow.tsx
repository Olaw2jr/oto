import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';
import {Icon, IconName} from './Icon';
import {Txt} from './Txt';

type SheetRowProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  value?: string;
  // Rows in a choice list are radios; the rest are buttons.
  selected?: boolean;
  accessibilityLabel?: string;
};

export const SheetRow = ({
  label,
  onPress,
  icon,
  value,
  selected,
  accessibilityLabel,
}: SheetRowProps) => {
  const {colors} = useTheme();
  const isChoice = selected !== undefined;
  return (
    <Pressable
      accessibilityRole={isChoice ? 'radio' : 'button'}
      accessibilityLabel={
        accessibilityLabel ?? (value ? `${label}, ${value}` : label)
      }
      accessibilityState={isChoice ? {checked: selected} : undefined}
      onPress={onPress}
      style={[styles.row, {borderBottomColor: colors.hairline}]}>
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={22} />
        </View>
      ) : null}
      <Txt style={styles.label}>{label}</Txt>
      {value ? <Txt variant="caption">{value}</Txt> : null}
      {selected ? <Icon name="check" size={20} /> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {marginRight: 14},
  label: {flex: 1},
});
