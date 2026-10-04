import React from 'react';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import DiscoverScreen from '../features/discover/DiscoverScreen';
import HomeScreen from '../features/home/HomeScreen';
import YouScreen from '../features/you/YouScreen';
import ClubScreen from '../features/club/ClubScreen';
import FollowingScreen from '../features/following/FollowingScreen';
import {TabBar} from './TabBar';
import {TabParamList} from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

const Tabs = () => (
  <Tab.Navigator screenOptions={{headerShown: false}} tabBar={renderTabBar}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Discover" component={DiscoverScreen} />
    <Tab.Screen name="Following" component={FollowingScreen} />
    <Tab.Screen name="Clubs" component={ClubScreen} />
    <Tab.Screen name="You" component={YouScreen} />
  </Tab.Navigator>
);

export default Tabs;
