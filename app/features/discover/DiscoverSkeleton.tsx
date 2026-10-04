import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

import {useTheme} from '../../theme/ThemeProvider';
import {Txt} from '../../ui';

// Canvas artboard 22: a turning ring and pulsing placeholders.
export const DiscoverSkeleton = () => {
  const {colors} = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 2400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.55,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ),
    ];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [spin, pulse]);

  const block = (width: number | string, height: number, extra?: object) => (
    <View
      style={[
        styles.block,
        {width, height, backgroundColor: colors.segment},
        extra,
      ]}
    />
  );
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar">
      <View style={styles.status}>
        <Animated.View style={{transform: [{rotate}]}}>
          <Svg width={40} height={40} viewBox="0 0 80 80">
            <Circle
              cx={40}
              cy={40}
              r={30}
              fill="none"
              stroke={colors.ink}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={[158, 30.5]}
            />
            <Circle cx={70} cy={40} r={7.5} fill={colors.kaki} />
          </Svg>
        </Animated.View>
        <Txt variant="caption" style={styles.statusText}>
          Finding your next listen
        </Txt>
      </View>

      <Animated.View style={[styles.placeholders, {opacity: pulse}]}>
        {block(200, 20)}
        <View style={styles.row}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.tile}>
              {block(108, 108)}
              {block(90, 12, styles.line)}
              {block(64, 10, styles.lineSmall)}
            </View>
          ))}
        </View>
        {[70, 60].map(w => (
          <View key={w} style={styles.listRow}>
            {block(62, 62)}
            <View style={styles.listText}>
              {block(`${w}%`, 13)}
              {block(`${w - 25}%`, 11, styles.lineSmall)}
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {borderRadius: 8},
  status: {alignItems: 'center', marginTop: 34},
  statusText: {marginTop: 12, fontSize: 14},
  placeholders: {marginTop: 34},
  row: {flexDirection: 'row', marginTop: 14},
  tile: {marginRight: 13},
  line: {marginTop: 10},
  lineSmall: {marginTop: 6},
  listRow: {flexDirection: 'row', alignItems: 'center', marginTop: 20},
  listText: {flex: 1, marginLeft: 14},
});
