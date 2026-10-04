import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import TabScreen from './Tabs';
import PlayerScreen from '../screens/Player';
import BooksScreen from '../screens/Books';
import SingleBooksScreen from '../screens/Books/single';
import {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="TabScreen" component={TabScreen} />
      <Stack.Screen name="PlayerScreen" component={PlayerScreen} />
      <Stack.Screen name="BooksScreen" component={BooksScreen} />
      <Stack.Screen name="SingleBooksScreen" component={SingleBooksScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
