import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from '../../../app/features/welcome/SplashScreen';
import OnboardingScreen from '../../../app/features/welcome/OnboardingScreen';
import SignInScreen from '../../../app/features/welcome/SignInScreen';
import SignUpScreen from '../../../app/features/welcome/SignUpScreen';
import {SESSION_STORAGE_KEY} from '../../../app/state/session';
import {mockNavigation, renderScreen} from '../../test-utils';

const route = (name: string) => ({key: name, name} as any);
const storedSession = async () =>
  JSON.parse((await AsyncStorage.getItem(SESSION_STORAGE_KEY)) ?? '{}');
const press = async (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });

beforeEach(() => AsyncStorage.clear());

describe('SplashScreen', () => {
  it('shows the mark, wordmark and tagline', async () => {
    await renderScreen(
      <SplashScreen navigation={mockNavigation()} route={route('Splash')} />,
    );
    expect(screen.getByLabelText('oto')).toBeOnTheScreen();
    expect(
      screen.getByText('A quiet place to listen, together.'),
    ).toBeOnTheScreen();
  });

  it('continues to onboarding on first launch', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <SplashScreen navigation={navigation} route={route('Splash')} />,
    );
    await press(screen.getByRole('button', {name: 'Continue to onboarding'}));
    expect(navigation.replace).toHaveBeenCalledWith('Onboarding');
  });

  it('goes straight to sign in once onboarding is done', async () => {
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({hasOnboarded: true, signedIn: false}),
    );
    const navigation = mockNavigation();
    await renderScreen(
      <SplashScreen navigation={navigation} route={route('Splash')} />,
    );
    await press(screen.getByRole('button', {name: 'Continue to sign in'}));
    expect(navigation.replace).toHaveBeenCalledWith('SignIn');
  });
});

describe('OnboardingScreen', () => {
  it('walks through four steps and ends at create account', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <OnboardingScreen navigation={navigation} route={route('Onboarding')} />,
    );

    expect(screen.getByText('Find your next listen.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Step 1 of 4')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Continue'}));

    expect(screen.getByText('Say where you are.')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Continue'}));

    expect(screen.getByText('Listen together.')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Continue'}));

    expect(screen.getByText('What do you like?')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Get started'}));

    expect(navigation.replace).toHaveBeenCalledWith('SignUp');
    expect(await storedSession()).toMatchObject({hasOnboarded: true});
  });

  it('can be skipped', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <OnboardingScreen navigation={navigation} route={route('Onboarding')} />,
    );
    await press(screen.getByRole('button', {name: 'Skip'}));
    expect(navigation.replace).toHaveBeenCalledWith('SignUp');
    expect(await storedSession()).toMatchObject({hasOnboarded: true});
  });
});

describe('SignInScreen', () => {
  it('signs in with email and password', async () => {
    await renderScreen(
      <SignInScreen navigation={mockNavigation()} route={route('SignIn')} />,
    );
    expect(screen.getByText('Welcome back.')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Email'), 'amani@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'secret123');
    await press(screen.getByRole('button', {name: 'Sign in'}));

    expect(await storedSession()).toMatchObject({signedIn: true});
  });

  it('offers Apple and Google sign-in', async () => {
    await renderScreen(
      <SignInScreen navigation={mockNavigation()} route={route('SignIn')} />,
    );
    await press(screen.getByRole('button', {name: 'Continue with Google'}));
    expect(await storedSession()).toMatchObject({signedIn: true});
    expect(
      screen.getByRole('button', {name: 'Continue with Apple'}),
    ).toBeOnTheScreen();
  });

  it('can reveal the password', async () => {
    await renderScreen(
      <SignInScreen navigation={mockNavigation()} route={route('SignIn')} />,
    );
    expect(screen.getByLabelText('Password')).toHaveProp(
      'secureTextEntry',
      true,
    );
    fireEvent.press(screen.getByRole('button', {name: 'Show password'}));
    expect(screen.getByLabelText('Password')).toHaveProp(
      'secureTextEntry',
      false,
    );
  });

  it('links to create an account', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <SignInScreen navigation={navigation} route={route('SignIn')} />,
    );
    fireEvent.press(screen.getByRole('link', {name: 'Create an account'}));
    expect(navigation.replace).toHaveBeenCalledWith('SignUp');
  });
});

describe('SignUpScreen', () => {
  it('creates an account once the terms are accepted', async () => {
    await renderScreen(
      <SignUpScreen navigation={mockNavigation()} route={route('SignUp')} />,
    );
    expect(screen.getByText('Create your account.')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Name'), 'Amani Wekesa');
    fireEvent.changeText(screen.getByLabelText('Email'), 'amani@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'secret123');

    const terms = screen.getByRole('checkbox', {
      name: 'I agree to the Terms and Privacy Policy.',
    });
    expect(terms).toHaveAccessibilityState({checked: true});
    fireEvent.press(terms);
    expect(
      screen.getByRole('button', {name: 'Create account'}),
    ).toHaveAccessibilityState({disabled: true});

    fireEvent.press(terms);
    await press(screen.getByRole('button', {name: 'Create account'}));
    expect(await storedSession()).toMatchObject({signedIn: true});
  });

  it('goes back and links to sign in', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <SignUpScreen navigation={navigation} route={route('SignUp')} />,
    );
    fireEvent.press(screen.getByRole('button', {name: 'Back'}));
    expect(navigation.goBack).toHaveBeenCalled();
    fireEvent.press(screen.getByRole('link', {name: 'Sign in'}));
    expect(navigation.replace).toHaveBeenCalledWith('SignIn');
  });
});
