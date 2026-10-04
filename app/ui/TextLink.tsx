import React from 'react';
import {Pressable, StyleSheet} from 'react-native';

import {ColorToken} from '../theme/colors';
import {Txt, TxtVariant} from './Txt';

type TextLinkProps = {
  label: string;
  onPress: () => void;
  variant?: TxtVariant;
  color?: ColorToken;
  // Links navigate; use 'button' for in-place actions such as Skip.
  role?: 'link' | 'button';
};

export const TextLink = ({
  label,
  onPress,
  variant = 'caption',
  color = 'ink',
  role = 'link',
}: TextLinkProps) => (
  <Pressable
    accessibilityRole={role}
    accessibilityLabel={label}
    onPress={onPress}
    style={styles.hit}>
    <Txt variant={variant} color={color} weight="semibold">
      {label}
    </Txt>
  </Pressable>
);

const styles = StyleSheet.create({
  hit: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 4},
});
