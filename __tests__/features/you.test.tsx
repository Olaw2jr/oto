import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SettingsScreen from '../../app/features/settings/SettingsScreen';
import YouScreen from '../../app/features/you/YouScreen';
import {APPEARANCE_STORAGE_KEY} from '../../app/theme/ThemeProvider';
import {SESSION_STORAGE_KEY} from '../../app/state/session';
import {SETTINGS_STORAGE_KEY} from '../../app/state/settings';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });

beforeEach(() => AsyncStorage.clear());

describe('YouScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <YouScreen
        navigation={navigation}
        route={{key: 'Y', name: 'You'} as any}
      />,
    );
    return navigation;
  };

  it('shows your profile and stats', async () => {
    await setup();
    expect(
      screen.getByRole('header', {name: 'Amani Wekesa'}),
    ).toBeOnTheScreen();
    expect(screen.getByText('@amani · Nairobi')).toBeOnTheScreen();
    expect(screen.getByLabelText('3 Listening')).toBeOnTheScreen();
    expect(screen.getByLabelText('41 Finished')).toBeOnTheScreen();
    expect(screen.getByLabelText('188 Following')).toBeOnTheScreen();
  });

  it('shows the last five weeks of listening', async () => {
    await setup();
    expect(screen.getByText('Last five weeks')).toBeOnTheScreen();
    expect(screen.getByText('26 days listened')).toBeOnTheScreen();
  });

  it('switches shelves and opens a book', async () => {
    const navigation = await setup();
    expect(screen.getByText(/^28% · Ch\. 14$/)).toBeOnTheScreen();

    await press(screen.getByRole('radio', {name: 'Want'}));
    await press(screen.getByRole('button', {name: /^The Silmarillion/}));
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'the-silmarillion',
    });

    await press(screen.getByRole('radio', {name: 'Finished'}));
    expect(
      screen.getByRole('button', {name: /^Atomic Habits/}),
    ).toBeOnTheScreen();
  });

  it('opens settings', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'Settings'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
  });
});

describe('SettingsScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <SettingsScreen
        navigation={navigation}
        route={{key: 'S', name: 'Settings'} as any}
      />,
    );
    return navigation;
  };

  it('lists the canvas settings', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Settings'})).toBeOnTheScreen();
    for (const label of ['Listening', 'Social', 'Appearance']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
    expect(screen.getByText('15 s · 30 s')).toBeOnTheScreen();
    expect(
      screen.getByRole('switch', {name: 'Download on Wi-Fi only'}),
    ).toHaveAccessibilityState({
      checked: true,
    });
  });

  // There's no profile editor yet, so the summary isn't presented as a link.
  it('shows your profile as a summary, not a link', async () => {
    await setup();
    const summary = screen.getByLabelText(/^Signed in as /);
    expect(summary.props.accessibilityRole).toBeUndefined();
    expect(summary.props.onPress).toBeUndefined();
  });

  it('cycles the default playback speed', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Playback speed, 1×'}));
    expect(
      screen.getByRole('button', {name: 'Playback speed, 1.25×'}),
    ).toBeOnTheScreen();
  });

  it('saves switches', async () => {
    await setup();
    await press(screen.getByRole('switch', {name: 'Private profile'}));
    expect(
      JSON.parse((await AsyncStorage.getItem(SETTINGS_STORAGE_KEY))!),
    ).toMatchObject({
      privateProfile: true,
    });
  });

  it('changes the appearance', async () => {
    await setup();
    expect(
      screen.getByRole('radio', {name: 'System'}),
    ).toHaveAccessibilityState({checked: true});
    await press(screen.getByRole('radio', {name: 'Dark'}));
    expect(await AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark');
  });

  it('signs out', async () => {
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({signedIn: true, hasOnboarded: true}),
    );
    await setup();
    await press(screen.getByRole('button', {name: 'Sign out'}));
    expect(
      JSON.parse((await AsyncStorage.getItem(SESSION_STORAGE_KEY))!),
    ).toMatchObject({
      signedIn: false,
    });
  });

  it('goes back to You', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'Back to You'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
