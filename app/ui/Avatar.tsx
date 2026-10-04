import React from 'react';
import {StyleSheet, View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';
import {Txt} from './Txt';

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');

type AvatarProps = {name: string; size?: number; ring?: boolean};

export const Avatar = ({name, size = 36, ring = false}: AvatarProps) => {
  const {colors} = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.tonal,
        },
        ring && [styles.ring, {borderColor: colors.paper}],
      ]}>
      <Txt
        color="avatarInk"
        weight="semibold"
        style={{fontSize: Math.round(size * 0.34), lineHeight: size * 0.42}}>
        {initials(name)}
      </Txt>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  ring: {borderWidth: 2},
});
