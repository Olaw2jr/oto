import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import ComingSoonScreen from '../screens/ComingSoonScreen';
import DiscoverScreen from '../screens/Discover';
import HomeScreen from '../screens/Home';
import MyBooksScreen from '../screens/MyBooks';
import {TabBar} from './TabBar';
import {TabParamList} from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const FollowingScreen = () => <ComingSoonScreen title="Following" />;
const ClubsScreen = () => <ComingSoonScreen title="Clubs" />;

const Tabs = () => (
  <Tab.Navigator
    screenOptions={{headerShown: false}}
    tabBar={props => <TabBar {...props} />}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Discover" component={DiscoverScreen} />
    <Tab.Screen name="Following" component={FollowingScreen} />
    <Tab.Screen name="Clubs" component={ClubsScreen} />
    <Tab.Screen name="You" component={MyBooksScreen} />
  </Tab.Navigator>
);

export default Tabs;
