import React, {ReactNode} from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTheme} from '../theme/ThemeProvider';
import {IconButton} from './IconButton';
import {Txt} from './Txt';

type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

// A bottom sheet over a dimmed backdrop. Tapping the backdrop or Close
// dismisses it; Android's back button does too.
export const Sheet = ({visible, title, onClose, children}: SheetProps) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: colors.paper,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}>
          <View style={[styles.handle, {backgroundColor: colors.switchOff}]} />
          <View style={styles.header}>
            <Txt variant="heading" style={styles.title}>
              {title}
            </Txt>
            <IconButton
              icon="close"
              label="Close"
              iconSize={20}
              onPress={onClose}
            />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {backgroundColor: 'rgba(0,0,0,0.45)'},
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {width: 38, height: 5, borderRadius: 3, alignSelf: 'center'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginRight: -10,
  },
  title: {fontSize: 19},
});
