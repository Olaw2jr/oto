import React, {ReactNode} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider} from '../theme/ThemeProvider';
import {SessionProvider} from './session';

export const AppProviders = ({children}: {children: ReactNode}) => (
  <SafeAreaProvider>
    <ThemeProvider>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);
