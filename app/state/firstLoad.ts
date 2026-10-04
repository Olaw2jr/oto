import {useEffect, useState} from 'react';

import {MOCK_LATENCY_MS} from '../data/latency';

// Screens whose mock data has already "loaded" this session.
const loaded = new Set<string>();

export const resetFirstLoads = () => loaded.clear();

// True while a screen's data is loading for the first time this session.
export const useFirstLoad = (key: string, ms = MOCK_LATENCY_MS) => {
  const [loading, setLoading] = useState(() => ms > 0 && !loaded.has(key));

  useEffect(() => {
    if (!loading) {
      return;
    }
    const timer = setTimeout(() => {
      loaded.add(key);
      setLoading(false);
    }, ms);
    return () => clearTimeout(timer);
  }, [key, ms, loading]);

  return loading;
};
