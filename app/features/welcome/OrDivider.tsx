import React from 'react';
import {StyleSheet, View} from 'react-native';

import {useTheme} from '../../theme/ThemeProvider';
import {Txt} from '../../ui';

export const OrDivider = () => {
  const {colors} = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.line, {backgroundColor: colors.switchOff}]} />
      <Txt variant="caption" style={styles.text}>
        or
      </Txt>
      <View style={[styles.line, {backgroundColor: colors.switchOff}]} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', marginVertical: 20},
  line: {flex: 1, height: StyleSheet.hairlineWidth * 2},
  text: {marginHorizontal: 14},
});
