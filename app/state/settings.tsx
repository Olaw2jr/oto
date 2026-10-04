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

export const SETTINGS_STORAGE_KEY = 'oto.settings';

export type Settings = {
  wifiOnly: boolean;
  privateProfile: boolean;
  spoilerSafe: boolean;
};

const defaults: Settings = {
  wifiOnly: true,
  privateProfile: false,
  spoilerSafe: true,
};

type SettingsValue = Settings & {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

export const SettingsProvider = ({children}: {children: ReactNode}) => {
  const [settings, setSettings] = useState<Settings>(defaults);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
      .then(raw => {
        const stored = raw ? JSON.parse(raw) : {};
        setSettings(current => ({
          ...current,
          ...Object.fromEntries(
            Object.entries(stored).filter(
              ([key, value]) => key in defaults && typeof value === 'boolean',
            ),
          ),
        }));
      })
      .catch(() => {});
  }, []);

  const set = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) =>
      setSettings(current => {
        const next = {...current, [key]: value};
        AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next)).catch(
          () => {},
        );
        return next;
      }),
    [],
  );

  const value = useMemo(() => ({...settings, set}), [settings, set]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error('useSettings must be used inside a SettingsProvider');
  }
  return value;
};
