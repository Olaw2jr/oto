import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

import logo from '../theme/logo';
import {useTheme} from '../theme/ThemeProvider';
import {Txt} from '../ui';

export type LoadingLayout = 'tiles' | 'list' | 'detail';

type LoadingStateProps = {
  message: string;
  // Placeholder shapes that hint at the page being loaded.
  layout?: LoadingLayout;
};

// Canvas artboard 22, used app-wide: the oto ring turning with its dot,
// and pulsing placeholders.
export const LoadingState = ({message, layout = 'list'}: LoadingStateProps) => {
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
  const {ring, dot} = logo;

  const listRows = (rows: number[]) =>
    rows.map(w => (
      <View key={w} style={styles.listRow}>
        {block(62, 62)}
        <View style={styles.listText}>
          {block(`${w}%`, 13)}
          {block(`${w - 25}%`, 11, styles.lineSmall)}
        </View>
      </View>
    ));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={styles.root}>
      <View style={styles.status}>
        <Animated.View style={{transform: [{rotate}]}}>
          <Svg
            width={40}
            height={40}
            viewBox={`0 0 ${logo.viewBox} ${logo.viewBox}`}>
            <Circle
              cx={ring.cx}
              cy={ring.cy}
              r={ring.r}
              fill="none"
              stroke={colors.ink}
              strokeWidth={ring.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={ring.dashArray}
              rotation={ring.rotation}
              origin={`${ring.cx}, ${ring.cy}`}
            />
            <Circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={colors.kaki} />
          </Svg>
        </Animated.View>
        <Txt variant="caption" style={styles.statusText}>
          {message}
        </Txt>
      </View>

      <Animated.View style={[styles.placeholders, {opacity: pulse}]}>
        {layout === 'detail' ? (
          <>
            <View style={styles.center}>{block(172, 172, styles.cover)}</View>
            <View style={styles.center}>
              {block('60%', 24)}
              {block('35%', 14, styles.line)}
            </View>
            {block('100%', 52, styles.button)}
            {block('100%', 44, styles.line)}
          </>
        ) : layout === 'tiles' ? (
          <>
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
            {listRows([70, 60])}
          </>
        ) : (
          <>
            {block(200, 20)}
            {listRows([75, 65, 70, 55])}
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
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
  center: {alignItems: 'center', marginBottom: 14},
  cover: {borderRadius: 12},
  button: {borderRadius: 26, marginTop: 6},
});
