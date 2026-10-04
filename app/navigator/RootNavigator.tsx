import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import BooksScreen from '../screens/Books';
import SingleBooksScreen from '../screens/Books/single';
import UpdateDetailsScreen from '../screens/Home/single';
import PlayerScreen from '../screens/Player';
import OnboardingScreen from '../screens/welcome/OnboardingScreen';
import SignInScreen from '../screens/welcome/SignInScreen';
import SignUpScreen from '../screens/welcome/SignUpScreen';
import SplashScreen from '../screens/welcome/SplashScreen';
import {useSession} from '../state/session';
import {useTheme} from '../theme/ThemeProvider';
import Tabs from './Tabs';
import {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const {status} = useSession();
  const {colors} = useTheme();

  if (status === 'loading') {
    return <View style={[styles.fill, {backgroundColor: colors.paper}]} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.paper},
      }}>
      {status === 'signedOut' ? (
        <Stack.Group screenOptions={{animation: 'fade'}}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen
            name="PlayerScreen"
            component={PlayerScreen}
            options={{animation: 'slide_from_bottom'}}
          />
          <Stack.Screen name="BooksScreen" component={BooksScreen} />
          <Stack.Screen
            name="SingleBooksScreen"
            component={SingleBooksScreen}
          />
          <Stack.Screen
            name="UpdateDetailsScreen"
            component={UpdateDetailsScreen}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({fill: {flex: 1}});

export default RootNavigator;
