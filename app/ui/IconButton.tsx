import React from 'react';
import {Pressable, StyleSheet} from 'react-native';

import {ColorToken} from '../theme/colors';
import {useTheme} from '../theme/ThemeProvider';
import {Icon, IconName} from './Icon';

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  background?: ColorToken;
  color?: ColorToken;
};

export const IconButton = ({
  icon,
  label,
  onPress,
  size = 44,
  iconSize = 24,
  background,
  color = 'ink',
}: IconButtonProps) => {
  const {colors} = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Math.max(0, (44 - size) / 2)}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background ? colors[background] : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Icon name={icon} size={iconSize} color={color} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {alignItems: 'center', justifyContent: 'center'},
});
