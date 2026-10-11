import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {FakeHttpTransport, OtoApiClient} from '../../../app/api';
import {AccountSession, InMemoryTokenStore} from '../../../app/auth';
import type {GoogleIdentity} from '../../../app/auth';
import SignInScreen from '../../../app/features/welcome/SignInScreen';
import SettingsScreen from '../../../app/features/settings/SettingsScreen';
import {SESSION_STORAGE_KEY} from '../../../app/state/session';
import {mockNavigation, renderScreen} from '../../test-utils';

const route = (name: string) => ({key: name, name} as any);
const press = async (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const storedSession = async () =>
  JSON.parse((await AsyncStorage.getItem(SESSION_STORAGE_KEY)) ?? '{}');
const tokens = {
  status: 200,
  headers: {},
  body: {access_token: 'a', refresh_token: 'r'},
};

function account(google: Partial<GoogleIdentity> = {}, stored: any = null) {
  const transport = new FakeHttpTransport();
  const session = new AccountSession(transport, new InMemoryTokenStore(stored));
  return {
    transport,
    session,
    value: {
      session,
      client: new OtoApiClient(transport, session),
      google: {available: false, idToken: async () => null, ...google},
      start: async () => {
        await session.restore();
        return () => {};
      },
      idle: async () => {},
    },
  };
}

beforeEach(() => AsyncStorage.clear());

describe('signing in to oto-api', () => {
  it('lists seeded readers on a development backend and signs in as one', async () => {
    const {transport, session, value} = account();
    transport.enqueue({
      status: 200,
      headers: {},
      body: {
        items: [
          {handle: 'amani', display_name: 'Amani Wekesa'},
          {handle: 'mika', display_name: 'Mika Tanaka'},
        ],
      },
    });
    await renderScreen(
      <SignInScreen navigation={mockNavigation()} route={route('SignIn')} />,
      {account: value},
    );
    await act(async () => {});

    transport.enqueue(tokens);
    await press(screen.getByRole('button', {name: 'Sign in as Amani Wekesa'}));

    expect(transport.requests[1]).toMatchObject({
      path: '/v1/auth/dev',
      body: {handle: 'amani'},
    });
    expect(session.signedIn()).toBe(true);
    expect((await storedSession()).signedIn).toBe(true);
  });

  it('shows no developer readers when the backend has them switched off', async () => {
    const {transport, value} = account();
    transport.enqueue({status: 404, headers: {}, body: {}});
    await renderScreen(
      <SignInScreen navigation={mockNavigation()} route={route('SignIn')} />,
      {account: value},
    );
    await act(async () => {});
    expect(screen.queryByText('Developer sign-in')).toBeNull();
  });

  it('signs in with Google once it is configured', async () => {
    const {transport, session, value} = account({
      available: true,
      idToken: async () => 'google-id-token-long-enough',
    });
    transport.enqueue({status: 404, headers: {}, body: {}});
    await renderScreen(
      <SignInScreen navigation={mockNavigation()} route={route('SignIn')} />,
      {account: value},
    );

    transport.enqueue(tokens);
    await press(screen.getByRole('button', {name: 'Continue with Google'}));

    expect(transport.requests[1]).toMatchObject({path: '/v1/auth/google'});
    expect(session.signedIn()).toBe(true);
    expect((await storedSession()).signedIn).toBe(true);
  });

  it('stays signed out when Google sign-in is cancelled', async () => {
    const {transport, value} = account({
      available: true,
      idToken: async () => null,
    });
    transport.enqueue({status: 404, headers: {}, body: {}});
    await renderScreen(
      <SignInScreen navigation={mockNavigation()} route={route('SignIn')} />,
      {account: value},
    );
    await press(screen.getByRole('button', {name: 'Continue with Google'}));
    expect((await storedSession()).signedIn).toBeFalsy();
  });

  it('tells the reader when sign-in fails', async () => {
    const {transport, value} = account({
      available: true,
      idToken: async () => 'google-id-token-long-enough',
    });
    transport.enqueue({status: 404, headers: {}, body: {}});
    await renderScreen(
      <SignInScreen navigation={mockNavigation()} route={route('SignIn')} />,
      {account: value},
    );
    transport.enqueue({status: 401, headers: {}, body: {}});
    await press(screen.getByRole('button', {name: 'Continue with Google'}));
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't sign you in. Please try again.",
    );
    expect((await storedSession()).signedIn).toBeFalsy();
  });

  it('signs the account out from Settings', async () => {
    const {transport, session, value} = account(
      {},
      {accessToken: 'a', refreshToken: 'r'},
    );
    await renderScreen(
      <SettingsScreen
        navigation={mockNavigation()}
        route={route('Settings')}
      />,
      {account: value},
    );
    transport.enqueue({status: 200, headers: {}, body: {revoked: true}});
    await press(screen.getByRole('button', {name: 'Sign out'}));
    expect(transport.requests.map(r => r.path)).toContain('/v1/auth/logout');
    expect(session.signedIn()).toBe(false);
  });
});
