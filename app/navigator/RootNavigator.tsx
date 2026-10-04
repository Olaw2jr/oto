import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import BookScreen from '../features/book/BookScreen';
import PlayerScreen from '../features/player/PlayerScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import OnboardingScreen from '../features/welcome/OnboardingScreen';
import SignInScreen from '../features/welcome/SignInScreen';
import SignUpScreen from '../features/welcome/SignUpScreen';
import SplashScreen from '../features/welcome/SplashScreen';
import {useSession} from '../state/session';
import {useTheme} from '../theme/ThemeProvider';
import Tabs from './Tabs';
import {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Interim until the social screens land.
const ClubPlaceholder = () => <ComingSoonScreen title="Quiet Pages" />;
const UpdatePlaceholder = () => <ComingSoonScreen title="Your update" />;

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
          <Stack.Screen name="Book" component={BookScreen} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{animation: 'slide_from_bottom'}}
          />
          <Stack.Screen name="Club" component={ClubPlaceholder} />
          <Stack.Screen
            name="UpdateCompose"
            component={UpdatePlaceholder}
            options={{presentation: 'modal'}}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({fill: {flex: 1}});

export default RootNavigator;
