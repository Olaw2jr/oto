import React, {ReactNode, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {
  createApplicationContainer,
  type ApplicationContainer,
} from '../composition';
import {ThemeProvider} from '../theme/ThemeProvider';
import {LibraryProvider} from './library';
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
  const [container] = useState(
    () => providedContainer ?? createApplicationContainer(),
  );

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <SettingsProvider>
            <LibraryProvider adapter={container.library}>
              <PlayerProvider
                createController={container.audio.createPlayerController}>
                <SocialProvider>
                  <TasteProvider>{children}</TasteProvider>
                </SocialProvider>
              </PlayerProvider>
            </LibraryProvider>
          </SettingsProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
