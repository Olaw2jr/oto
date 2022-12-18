import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/Home";
import UpdateDetailsScreen from "../screens/Home/single";

export type StackPrams = {
  HomeScreen: any;
  UpdateDetailsScreen: any;
};

const Stack = createNativeStackNavigator<StackPrams>();

const UpdateStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen
        name="UpdateDetailsScreen"
        component={UpdateDetailsScreen}
      />
    </Stack.Navigator>
  );
};

export default UpdateStack;
