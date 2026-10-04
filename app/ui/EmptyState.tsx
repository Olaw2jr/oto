import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';

import {useTheme} from '../theme/ThemeProvider';
import {Button} from './Button';
import {Txt} from './Txt';

type EmptyStateProps = {
  title: string;
  body: string;
  action?: {label: string; onPress: () => void};
};

// The canvas's empty shelf: an open ring waiting for its dot.
export const EmptyState = ({title, body, action}: EmptyStateProps) => {
  const {colors} = useTheme();
  return (
    <View style={styles.root}>
      <Svg width={96} height={96} viewBox="0 0 80 80">
        <Circle
          cx={40}
          cy={40}
          r={30}
          fill="none"
          stroke={colors.switchOff}
          strokeWidth={4}
          strokeDasharray={[158, 30.5]}
          rotation={-15.9}
          origin="40, 40"
          strokeLinecap="round"
        />
        <Path
          d="M33 40h14M40 33v14"
          stroke={colors.graphite}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
      <Txt variant="heading" align="center" style={styles.title}>
        {title}
      </Txt>
      <Txt color="graphite" align="center" style={styles.body}>
        {body}
      </Txt>
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} size="small" onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {alignItems: 'center', paddingVertical: 48},
  title: {fontSize: 24, lineHeight: 30, marginTop: 26},
  body: {fontSize: 15.5, lineHeight: 24, marginTop: 8, maxWidth: 280},
  action: {marginTop: 24},
});
