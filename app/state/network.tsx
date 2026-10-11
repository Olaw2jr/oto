import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react';

import type {Connectivity} from '../connectivity';

const ConnectivityContext = createContext<Connectivity | null>(null);

export const ConnectivityProvider = ({
  connectivity,
  children,
}: {
  connectivity: Connectivity;
  children: ReactNode;
}) => (
  <ConnectivityContext.Provider value={connectivity}>
    {children}
  </ConnectivityContext.Provider>
);

const useConnectivity = () => {
  const connectivity = useContext(ConnectivityContext);
  if (!connectivity) {
    throw new Error('useOnline must be used inside a ConnectivityProvider');
  }
  return connectivity;
};

// Offline only when the device is sure; an unknown state, or no provider,
// counts as online.
export const useOnline = () => {
  const connectivity = useContext(ConnectivityContext);
  const subscribe = useCallback(
    (onChange: () => void) => connectivity?.subscribe(onChange) ?? (() => {}),
    [connectivity],
  );
  const online = useCallback(
    () => connectivity?.current().online ?? true,
    [connectivity],
  );
  return useSyncExternalStore(subscribe, online, online);
};

export const useRetryConnection = () => {
  const connectivity = useConnectivity();
  return useCallback(() => {
    connectivity.refresh().catch(() => {});
  }, [connectivity]);
};
