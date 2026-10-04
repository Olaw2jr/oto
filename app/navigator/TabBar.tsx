import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {MiniPlayer} from '../components/MiniPlayer';
import {useTheme} from '../theme/ThemeProvider';
import {Icon, IconName, Txt} from '../ui';
import {TabParamList} from './types';

const tabIcons: Record<keyof TabParamList, IconName> = {
  Home: 'home',
  Discover: 'search',
  Following: 'following',
  Clubs: 'clubs',
  You: 'you',
};

export const TAB_BAR_HEIGHT = 62;

export const TabBar = ({state, navigation}: BottomTabBarProps) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();

  // Home has its own Continue listening card and Clubs has a composer.
  const current = state.routes[state.index].name;
  const showMiniPlayer = current !== 'Home' && current !== 'Clubs';

  return (
    <View>
      {showMiniPlayer ? <MiniPlayer /> : null}
      <View
        accessibilityRole="tablist"
        style={[
          styles.bar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: colors.paper,
            borderTopColor: colors.hairline,
          },
        ]}>
        {state.routes.map((route, index) => {
          const name = route.name as keyof TabParamList;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={name}
              accessibilityState={{selected: focused}}
              onPress={onPress}
              style={styles.item}>
              <View
                style={[
                  styles.pill,
                  focused && {backgroundColor: colors.tonal},
                ]}>
                <Icon
                  name={tabIcons[name]}
                  color={focused ? 'ink' : 'graphite'}
                  strokeWidth={focused ? 2 : 1.7}
                />
              </View>
              <Txt
                variant="small"
                color={focused ? 'ink' : 'graphite'}
                weight={focused ? 'semibold' : 'medium'}
                style={styles.label}>
                {name}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pill: {
    width: 58,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {fontSize: 10.5, lineHeight: 14, marginTop: 3},
});
