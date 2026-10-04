import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';

import {ColorToken} from '../theme/colors';
import {useTheme} from '../theme/ThemeProvider';
import {fonts} from '../theme/typography';
import {Txt, TxtVariant} from './Txt';

type PillProps = {
  label: string;
  height?: number;
  background?: ColorToken;
  border?: ColorToken;
  color?: ColorToken;
  weight?: keyof typeof fonts.sans;
  variant?: TxtVariant;
  fontSize?: number;
  style?: ViewStyle;
};

// A rounded label. The box centres the text: lineHeight-based centring
// drifts on Android because of font padding (issue #15).
export const Pill = ({
  label,
  height = 34,
  background,
  border,
  color = 'ink',
  weight = 'medium',
  variant = 'caption',
  fontSize,
  style,
}: PillProps) => {
  const {colors} = useTheme();
  return (
    <View
      style={[
        styles.box,
        {height, borderRadius: height / 2},
        background && {backgroundColor: colors[background]},
        border && [styles.border, {borderColor: colors[border]}],
        style,
      ]}>
      <Txt
        variant={variant}
        color={color}
        weight={weight}
        numberOfLines={1}
        style={[styles.label, fontSize ? {fontSize} : null]}>
        {label}
      </Txt>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15},
  border: {borderWidth: 1},
  label: {
    lineHeight: undefined,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
