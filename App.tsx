import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';

import RootNavigator from './app/navigator/RootNavigator';
import {AppProviders} from './app/state/AppProviders';
import {navigationTheme} from './app/theme/navigationTheme';
import {useTheme} from './app/theme/ThemeProvider';

const ThemedApp = () => {
  const {colorScheme} = useTheme();

  return (
    <>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <NavigationContainer theme={navigationTheme(colorScheme)}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};

const App = () => (
  <AppProviders>
    <ThemedApp />
  </AppProviders>
);

export default App;
