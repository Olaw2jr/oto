import React, {ReactNode} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider} from '../theme/ThemeProvider';
import {LibraryProvider} from './library';
import {PlayerProvider} from './player';
import {SessionProvider} from './session';

export const AppProviders = ({children}: {children: ReactNode}) => (
  <SafeAreaProvider>
    <ThemeProvider>
      <SessionProvider>
        <LibraryProvider>
          <PlayerProvider>{children}</PlayerProvider>
        </LibraryProvider>
      </SessionProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);
