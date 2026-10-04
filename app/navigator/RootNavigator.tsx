import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import BookDetailsScreen from '../features/book/BookDetailsScreen';
import BookScreen from '../features/book/BookScreen';
import PlayerScreen from '../features/player/PlayerScreen';
import SettingsScreen from '../features/settings/SettingsScreen';
import ClubScreen from '../features/club/ClubScreen';
import ThreadScreen from '../features/following/ThreadScreen';
import UpdateComposeScreen from '../features/following/UpdateComposeScreen';
import OnboardingScreen from '../features/welcome/OnboardingScreen';
import SignInScreen from '../features/welcome/SignInScreen';
import SignUpScreen from '../features/welcome/SignUpScreen';
import SplashScreen from '../features/welcome/SplashScreen';
import {useSession} from '../state/session';
import {useTheme} from '../theme/ThemeProvider';
import Tabs from './Tabs';
import {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const {status, hasOnboarded} = useSession();
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
        // The first screen listed opens first: new listeners see the splash
        // and onboarding, returning ones (or anyone who signed out) Sign in.
        <Stack.Group screenOptions={{animation: 'fade'}}>
          {hasOnboarded ? (
            <>
              <Stack.Screen name="SignIn" component={SignInScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
              <Stack.Screen name="SignIn" component={SignInScreen} />
            </>
          )}
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="Book" component={BookScreen} />
          <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{animation: 'slide_from_bottom'}}
          />
          <Stack.Screen name="Club" component={ClubScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Thread" component={ThreadScreen} />
          <Stack.Screen
            name="UpdateCompose"
            component={UpdateComposeScreen}
            options={{presentation: 'modal'}}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({fill: {flex: 1}});

export default RootNavigator;
