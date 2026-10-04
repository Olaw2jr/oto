import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SafeAreaProvider } from "react-native-safe-area-context";

import { TailwindProvider } from "./app/theme/TailwindProvider";
import utilities from "./tailwind.json";

import TabScreen from "./app/navigator/Tabs";
import StackNavigator from "./app/navigator/Stack";
import PlayerScreen from "./app/screens/Player";
import BooksScreen from "./app/screens/Books";

export type StackPrams = {
  TabScreen: any;
  PlayerScreen: any;
  BooksScreen: any;
};

const Stack = createNativeStackNavigator<StackPrams>();

const Eyy = () => {
  return (
    <TailwindProvider utilities={utilities} colorScheme="dark">
      <SafeAreaProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </TailwindProvider>
  );
};

export default Eyy;
