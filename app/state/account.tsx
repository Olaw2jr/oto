import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import type {ApplicationContainer} from '../composition/ApplicationContainer';
import type {DeveloperReader} from '../auth';
import {useSession} from './session';

type Account = NonNullable<ApplicationContainer['account']>;

export type GoogleResult = 'signed-in' | 'cancelled' | 'unavailable';

type AccountValue = {
  googleAvailable: boolean;
  // Seeded readers on a development backend; empty everywhere else.
  developerReaders: DeveloperReader[];
  signInWithGoogle(): Promise<GoogleResult>;
  signInAsDeveloper(handle: string): Promise<void>;
  signOut(): Promise<void>;
};

const AccountContext = createContext<AccountValue | null>(null);

// The oto-api account, when a backend is configured. Signing in here also
// marks the local session signed in, so the app opens as before.
export const AccountProvider = ({
  account,
  children,
}: {
  account?: Account;
  children: ReactNode;
}) => {
  const {signIn} = useSession();
  const [developerReaders, setDeveloperReaders] = useState<DeveloperReader[]>(
    [],
  );

  useEffect(() => {
    if (!account) return;
    let active = true;
    account.session.developerReaders().then(
      readers => active && setDeveloperReaders(readers),
      () => {},
    );
    return () => {
      active = false;
    };
  }, [account]);

  if (!account) {
    return (
      <AccountContext.Provider value={null}>{children}</AccountContext.Provider>
    );
  }

  const value: AccountValue = {
    googleAvailable: account.google.available,
    developerReaders,
    async signInWithGoogle() {
      if (!account.google.available) return 'unavailable';
      const idToken = await account.google.idToken();
      if (!idToken) return 'cancelled';
      await account.session.signInWithGoogle(idToken);
      signIn();
      return 'signed-in';
    },
    async signInAsDeveloper(handle) {
      await account.session.signInAsDeveloper(handle);
      signIn();
    },
    signOut: () => account.session.signOut(),
  };
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
};

// Null when no backend is configured; screens then keep their local flow.
export const useAccount = () => useContext(AccountContext);
