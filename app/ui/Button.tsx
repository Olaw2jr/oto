import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';
import {Icon, IconName} from './Icon';
import {Txt} from './Txt';

type ButtonProps = {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'tonal';
  size?: 'large' | 'small';
  icon?: IconName;
  accessibilityLabel?: string;
  stretch?: boolean;
  disabled?: boolean;
};

export const Button = ({
  label,
  onPress,
  kind = 'primary',
  size = 'large',
  icon,
  accessibilityLabel,
  stretch = false,
  disabled = false,
}: ButtonProps) => {
  const {colors} = useTheme();
  const height = size === 'large' ? 54 : 44;
  const background = {
    primary: colors.ink,
    secondary: colors.surface,
    tonal: colors.segment,
  }[kind];
  const foreground = kind === 'primary' ? 'onInk' : 'ink';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        {
          height,
          minHeight: 44,
          borderRadius: height / 2,
          paddingHorizontal: size === 'large' ? 24 : 18,
          backgroundColor: background,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        kind === 'secondary' && {
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: colors.switchOff,
        },
        stretch && styles.stretch,
      ]}>
      <View style={styles.content}>
        {icon ? (
          <View style={styles.icon}>
            <Icon name={icon} size={18} color={foreground} />
          </View>
        ) : null}
        <Txt
          variant="strong"
          color={foreground}
          style={size === 'small' && styles.small}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {alignItems: 'center', justifyContent: 'center'},
  content: {flexDirection: 'row', alignItems: 'center'},
  icon: {marginRight: 10},
  stretch: {flex: 1},
  small: {fontSize: 14},
});
