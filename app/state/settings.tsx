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

export type Notifications = 'clubs' | 'all' | 'none';
export type SkipIntervals = {back: number; forward: number};

export const SKIP_OPTIONS: SkipIntervals[] = [
  {back: 10, forward: 10},
  {back: 15, forward: 30},
  {back: 30, forward: 30},
];

// Playback speeds in the order the player cycles through them.
export const SPEED_OPTIONS = [1, 1.25, 1.5, 2, 0.75];

export const NOTIFICATION_LABELS: Record<Notifications, string> = {
  clubs: 'Club sessions',
  all: 'Everything',
  none: 'Nothing',
};

export type Settings = {
  wifiOnly: boolean;
  privateProfile: boolean;
  spoilerSafe: boolean;
  notifications: Notifications;
  skip: SkipIntervals;
  speed: number;
  // Books to finish this year.
  goal: number;
};

export const GOAL_OPTIONS = [6, 12, 24, 36, 52];

const defaults: Settings = {
  wifiOnly: true,
  privateProfile: false,
  spoilerSafe: true,
  notifications: 'clubs',
  skip: {back: 15, forward: 30},
  speed: 1,
  goal: 12,
};

// Keeps only stored values of the right shape.
const valid = (key: string, value: unknown) => {
  if (key === 'notifications') {
    return typeof value === 'string' && value in NOTIFICATION_LABELS;
  }
  if (key === 'goal') {
    return GOAL_OPTIONS.includes(value as number);
  }
  if (key === 'speed') {
    return SPEED_OPTIONS.includes(value as number);
  }
  if (key === 'skip') {
    return SKIP_OPTIONS.some(
      o =>
        o.back === (value as SkipIntervals)?.back &&
        o.forward === (value as SkipIntervals)?.forward,
    );
  }
  return key in defaults && typeof value === 'boolean';
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
            Object.entries(stored).filter(([key, value]) => valid(key, value)),
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
