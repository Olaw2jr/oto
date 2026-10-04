import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home';
import UpdateDetailsScreen from '../screens/Home/single';
import {UpdateStackParamList} from './types';

const Stack = createNativeStackNavigator<UpdateStackParamList>();

const UpdateStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen
        name="UpdateDetailsScreen"
        component={UpdateDetailsScreen}
      />
    </Stack.Navigator>
  );
};

export default UpdateStack;
