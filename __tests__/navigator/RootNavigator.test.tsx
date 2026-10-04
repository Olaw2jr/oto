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

  it('opens the player from Home and returns', async () => {
    await signedIn();
    await renderAsync(<App />);

    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {name: 'Resume Where the Crawdads Sing'}),
      );
    });
    expect(screen.getByRole('button', {name: 'Pause'})).toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', {name: 'Close player'}));
    });
    expect(screen.getByRole('tab', {name: 'Home'})).toBeOnTheScreen();
  });

  it('shows the mini player on other tabs and opens a book from Discover', async () => {
    await signedIn();
    await renderAsync(<App />);
    expect(screen.queryByRole('button', {name: /^Open player:/})).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByRole('tab', {name: 'Discover'}));
    });
    expect(
      screen.getByRole('button', {
        name: /^Open player: Where the Crawdads Sing/,
      }),
    ).toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', {name: /^2\. Project Hail Mary/}),
      );
    });
    expect(
      screen.getByRole('header', {name: 'Project Hail Mary'}),
    ).toBeOnTheScreen();
  });
});
