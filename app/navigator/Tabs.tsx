import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  UserIcon,
} from 'react-native-heroicons/outline';

import DiscoverScreen from '../screens/Discover';
import BoookScreen from '../screens/MyBooks';
import ProfileScreen from '../screens/Profile';
import UpdateStack from './UpdateStack';

export type TabPrams = {
  HomeScreen: any;
  DiscoverScreen: any;
  BoookScreen: any;
  BookDetails: any;
  ProfileScreen: any;
  UpdateStack: any;
};

const Tab = createBottomTabNavigator<TabPrams>();

const TabsScreen = () => {
  return (
    <Tab.Navigator
      initialRouteName="UpdateStack"
      screenOptions={{
        tabBarActiveTintColor: '#22d3ee',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 0,
          position: 'absolute',
          elevation: 0,
          paddingBottom: 4,
          opacity: 0.9,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}>
      <Tab.Screen
        name="UpdateStack"
        component={UpdateStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color, size}) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="DiscoverScreen"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({color, size}) => (
            <MagnifyingGlassIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="BoookScreen"
        component={BoookScreen}
        options={{
          tabBarLabel: 'My Books',
          tabBarIcon: ({color, size}) => (
            <BookOpenIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color, size}) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabsScreen;
