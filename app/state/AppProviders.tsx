import React, {ReactNode, useEffect, useState} from 'react';
import {ActivityIndicator, Button, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {
  createPersistentApplicationContainer,
  type ApplicationContainer,
} from '../composition';
import {ThemeProvider} from '../theme/ThemeProvider';
import {LibraryProvider} from './library';
import {ConnectivityProvider} from './network';
import {reportStartup} from '../telemetry/startup';
import {installGlobalErrorReporting, TelemetryProvider} from './telemetry';
import {PlayerProvider} from './player';
import {SessionProvider} from './session';
import {SettingsProvider} from './settings';
import {SocialProvider} from './social';
import {TasteProvider} from './taste';

export const AppProviders = ({
  children,
  container: providedContainer,
}: {
  children: ReactNode;
  container?: ApplicationContainer;
}) => {
  const [container, setContainer] = useState(providedContainer);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (providedContainer) {
      return;
    }
    let active = true;
    setError(false);
    createPersistentApplicationContainer().then(
      value => {
        if (active) {
          setContainer(value);
        }
      },
      () => {
        if (active) {
          setError(true);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [providedContainer, attempt]);

  // Report uncaught errors and upload queued telemetry while mounted.
  useEffect(() => {
    if (!container) return;
    const uninstall = installGlobalErrorReporting(
      container.telemetry.telemetry,
    );
    const stopUploads = container.telemetry.start();
    reportStartup(container.telemetry.telemetry);
    return () => {
      stopUploads();
      uninstall();
    };
  }, [container]);

  if (!container) {
    return (
      <View accessibilityRole="summary">
        {error ? (
          <>
            <Text>
              Could not open your library. Your saved data has been kept.
            </Text>
            <Button
              title="Retry"
              onPress={() => setAttempt(value => value + 1)}
            />
          </>
        ) : (
          <ActivityIndicator accessibilityLabel="Opening library" />
        )}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TelemetryProvider telemetry={container.telemetry.telemetry}>
          <ConnectivityProvider connectivity={container.connectivity}>
            <SessionProvider>
              <SettingsProvider>
                <LibraryProvider
                  adapter={container.library}
                  collections={container.collections}>
                  <PlayerProvider
                    createController={container.audio.createPlayerController}>
                    <SocialProvider>
                      <TasteProvider>{children}</TasteProvider>
                    </SocialProvider>
                  </PlayerProvider>
                </LibraryProvider>
              </SettingsProvider>
            </SessionProvider>
          </ConnectivityProvider>
        </TelemetryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
