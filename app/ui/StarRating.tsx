import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {Icon} from './Icon';

type StarRatingProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  size?: number;
};

// Five 44pt star buttons. Tapping the current rating clears it.
export const StarRating = ({value, onChange, size = 26}: StarRatingProps) => (
  <View style={styles.row}>
    {[1, 2, 3, 4, 5].map(n => {
      const filled = value !== undefined && n <= value;
      return (
        <Pressable
          key={n}
          accessibilityRole="button"
          accessibilityLabel={n === 1 ? '1 star' : `${n} stars`}
          accessibilityState={{selected: filled}}
          onPress={() => onChange(value === n ? undefined : n)}
          style={styles.star}>
          <Icon name={filled ? 'starFilled' : 'star'} size={size} />
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {flexDirection: 'row'},
  star: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
});
