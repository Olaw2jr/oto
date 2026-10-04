import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import StackNavigator from './app/navigator/Stack';
import {navigationTheme} from './app/theme/navigationTheme';
import {ThemeProvider, useTheme} from './app/theme/ThemeProvider';

const ThemedApp = () => {
  const {colorScheme} = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <NavigationContainer theme={navigationTheme(colorScheme)}>
        <StackNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <ThemedApp />
  </ThemeProvider>
);

export default App;
