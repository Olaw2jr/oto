import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSION_STORAGE_KEY = 'oto.session';

type Stored = {signedIn: boolean; hasOnboarded: boolean};

type SessionValue = {
  status: 'loading' | 'signedOut' | 'signedIn';
  hasOnboarded: boolean;
  completeOnboarding: () => void;
  // Mock auth: there is no backend yet, so any sign-in succeeds.
  signIn: () => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

const parse = (raw: string | null): Stored => {
  try {
    const value = raw ? JSON.parse(raw) : null;
    return {
      signedIn: value?.signedIn === true,
      hasOnboarded: value?.hasOnboarded === true,
    };
  } catch {
    return {signedIn: false, hasOnboarded: false};
  }
};

export const SessionProvider = ({children}: {children: ReactNode}) => {
  const [loaded, setLoaded] = useState(false);
  const [stored, setStored] = useState<Stored>({
    signedIn: false,
    hasOnboarded: false,
  });

  useEffect(() => {
    AsyncStorage.getItem(SESSION_STORAGE_KEY)
      .then(raw => setStored(parse(raw)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((patch: Partial<Stored>) => {
    setStored(current => {
      const next = {...current, ...patch};
      AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next)).catch(
        () => {},
      );
      return next;
    });
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      status: !loaded ? 'loading' : stored.signedIn ? 'signedIn' : 'signedOut',
      hasOnboarded: stored.hasOnboarded,
      completeOnboarding: () => update({hasOnboarded: true}),
      signIn: () => update({signedIn: true, hasOnboarded: true}),
      signOut: () => update({signedIn: false}),
    }),
    [loaded, stored, update],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside a SessionProvider');
  }
  return value;
};
