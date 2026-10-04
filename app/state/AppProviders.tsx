import React, {ReactNode} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider} from '../theme/ThemeProvider';
import {LibraryProvider} from './library';
import {PlayerProvider} from './player';
import {SessionProvider} from './session';
import {SettingsProvider} from './settings';
import {SocialProvider} from './social';

export const AppProviders = ({children}: {children: ReactNode}) => (
  <SafeAreaProvider>
    <ThemeProvider>
      <SessionProvider>
        <SettingsProvider>
          <LibraryProvider>
            <PlayerProvider>
              <SocialProvider>{children}</SocialProvider>
            </PlayerProvider>
          </LibraryProvider>
        </SettingsProvider>
      </SessionProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);
