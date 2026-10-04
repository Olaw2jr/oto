import React from 'react';
import {Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  SESSION_STORAGE_KEY,
  SessionProvider,
  useSession,
} from '../../app/state/session';

const Probe = () => {
  const s = useSession();
  return (
    <>
      <Text testID="state">{`${s.status}/${s.hasOnboarded}`}</Text>
      <Text onPress={s.completeOnboarding}>onboard</Text>
      <Text onPress={() => s.signIn()}>signIn</Text>
      <Text onPress={s.signOut}>signOut</Text>
    </>
  );
};

const mount = async () => {
  render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
  await act(async () => {});
};
const state = () => screen.getByTestId('state').props.children;
const press = async (label: string) =>
  act(async () => {
    fireEvent.press(screen.getByText(label));
  });

beforeEach(() => AsyncStorage.clear());

describe('session', () => {
  it('starts signed out and not onboarded on first launch', async () => {
    await mount();
    expect(state()).toBe('signedOut/false');
  });

  it('remembers onboarding and sign-in across launches', async () => {
    await mount();
    await press('onboard');
    await press('signIn');
    expect(state()).toBe('signedIn/true');

    screen.unmount();
    await mount();
    expect(state()).toBe('signedIn/true');
  });

  it('signs out but keeps onboarding done', async () => {
    await mount();
    await press('onboard');
    await press('signIn');
    await press('signOut');
    expect(state()).toBe('signedOut/true');
    expect(
      JSON.parse((await AsyncStorage.getItem(SESSION_STORAGE_KEY))!),
    ).toEqual({
      signedIn: false,
      hasOnboarded: true,
    });
  });

  it('recovers from corrupt stored state', async () => {
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, '{not json');
    await mount();
    expect(state()).toBe('signedOut/false');
  });
});
