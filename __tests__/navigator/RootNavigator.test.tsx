import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import App from '../../App';
import {SESSION_STORAGE_KEY} from '../../app/state/session';
import {renderAsync} from '../test-utils';

const signedIn = () =>
  AsyncStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({signedIn: true, hasOnboarded: true}),
  );

beforeEach(() => AsyncStorage.clear());

describe('RootNavigator', () => {
  it('opens on the splash screen for a new install', async () => {
    await renderAsync(<App />);
    expect(
      screen.getByText('A quiet place to listen, together.'),
    ).toBeOnTheScreen();
  });

  it('takes a new listener from splash through onboarding to the tabs', async () => {
    await renderAsync(<App />);
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {name: 'Continue to onboarding'}),
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', {name: 'Skip'}));
    });
    expect(screen.getByText('Create your account.')).toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', {name: 'Create account'}));
    });
    expect(screen.getByRole('tab', {name: 'Home'})).toBeOnTheScreen();
  });

  it('shows five tabs with Home selected for a signed-in listener', async () => {
    await signedIn();
    await renderAsync(<App />);

    const names = ['Home', 'Discover', 'Following', 'Clubs', 'You'];
    for (const name of names) {
      expect(screen.getByRole('tab', {name})).toBeOnTheScreen();
    }
    expect(screen.getByRole('tab', {name: 'Home'})).toHaveAccessibilityState({
      selected: true,
    });
  });

  it('switches tabs', async () => {
    await signedIn();
    await renderAsync(<App />);

    await act(async () => {
      fireEvent.press(screen.getByRole('tab', {name: 'Following'}));
    });
    expect(
      screen.getByRole('tab', {name: 'Following'}),
    ).toHaveAccessibilityState({
      selected: true,
    });
    expect(screen.getByRole('header', {name: 'Following'})).toBeOnTheScreen();
  });
});
