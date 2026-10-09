import React, {createContext, ReactNode, useContext} from 'react';

import {noopTelemetry, type Telemetry} from '../telemetry';

const TelemetryContext = createContext<Telemetry>(noopTelemetry);

export const TelemetryProvider = ({
  telemetry,
  children,
}: {
  telemetry: Telemetry;
  children: ReactNode;
}) => (
  <TelemetryContext.Provider value={telemetry}>
    {children}
  </TelemetryContext.Provider>
);

export const useTelemetry = () => useContext(TelemetryContext);

type ErrorUtilsLike = {
  getGlobalHandler(): (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler(handler: (error: unknown, isFatal?: boolean) => void): void;
};

// Reports uncaught JS errors, then lets React Native handle them as before.
export const installGlobalErrorReporting = (
  telemetry: Telemetry,
  errorUtils: ErrorUtilsLike | undefined = (
    globalThis as {ErrorUtils?: ErrorUtilsLike}
  ).ErrorUtils,
): (() => void) => {
  if (!errorUtils) return () => {};
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    telemetry.error(error, {fatal: Boolean(isFatal), source: 'global'});
    previous(error, isFatal);
  });
  return () => errorUtils.setGlobalHandler(previous);
};
