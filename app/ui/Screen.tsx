import React, {ReactNode} from 'react';
import {ScrollView, StyleSheet, View, ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTheme} from '../theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  // Extra space at the bottom, e.g. for the tab bar and mini player.
  bottomInset?: number;
  padded?: boolean;
  contentStyle?: ViewStyle;
  footer?: ReactNode;
};

export const Screen = ({
  children,
  scroll = false,
  bottomInset = 0,
  padded = true,
  contentStyle,
  footer,
}: ScreenProps) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const content = [
    padded && styles.padded,
    {paddingTop: insets.top + 10, paddingBottom: bottomInset + 24},
    contentStyle,
  ];

  return (
    <View style={[styles.root, {backgroundColor: colors.paper}]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, content]}>{children}</View>
      )}
      {footer ? (
        <View
          style={[
            styles.padded,
            {paddingBottom: Math.max(insets.bottom, 16) + 18},
          ]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  padded: {paddingHorizontal: 20},
});
