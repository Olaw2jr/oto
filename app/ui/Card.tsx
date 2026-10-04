import React from 'react';
import {StyleSheet, View, ViewProps} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

export const Card = ({style, ...props}: ViewProps) => {
  const {colors, colorScheme} = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.card,
        {backgroundColor: colors.surface},
        colorScheme === 'dark' && [
          styles.outline,
          {borderColor: colors.hairline},
        ],
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  outline: {borderWidth: 1},
  card: {
    borderRadius: 24,
    shadowColor: '#1B1B19',
    shadowOpacity: 0.06,
    shadowRadius: 15,
    shadowOffset: {width: 0, height: 8},
    elevation: 2,
  },
});
