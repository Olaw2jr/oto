import React from 'react';
import {NavigationContainer} from '@react-navigation/native';

import {SafeAreaProvider} from 'react-native-safe-area-context';

import {TailwindProvider} from './app/theme/TailwindProvider';
import utilities from './tailwind.json';

import StackNavigator from './app/navigator/Stack';

const App = () => {
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

export default App;
