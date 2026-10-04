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

export const TASTE_STORAGE_KEY = 'oto.taste';

type Taste = {genres: string[]; authors: string[]};

type TasteValue = Taste & {save: (taste: Taste) => void};

const TasteContext = createContext<TasteValue | null>(null);

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : [];

export const TasteProvider = ({children}: {children: ReactNode}) => {
  const [taste, setTaste] = useState<Taste>({genres: [], authors: []});

  useEffect(() => {
    AsyncStorage.getItem(TASTE_STORAGE_KEY)
      .then(raw => {
        const stored = raw ? JSON.parse(raw) : null;
        if (stored) {
          setTaste({
            genres: strings(stored.genres),
            authors: strings(stored.authors),
          });
        }
      })
      .catch(() => {});
  }, []);

  const save = useCallback((next: Taste) => {
    setTaste(next);
    AsyncStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(next)).catch(
      () => {},
    );
  }, []);

  const value = useMemo(() => ({...taste, save}), [taste, save]);
  return (
    <TasteContext.Provider value={value}>{children}</TasteContext.Provider>
  );
};

export const useTaste = () => {
  const value = useContext(TasteContext);
  if (!value) {
    throw new Error('useTaste must be used inside a TasteProvider');
  }
  return value;
};
