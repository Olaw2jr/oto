import React, {ReactElement} from 'react';
import {act, render} from '@testing-library/react-native';

import {ThemeProvider} from '../app/theme/ThemeProvider';
import {AppProviders} from '../app/state/AppProviders';

// The providers resolve stored state asynchronously after mount;
// flush those updates so tests don't trip act() warnings.
export const renderAsync = async (ui: ReactElement) => {
  const result = render(ui);
  await act(async () => {});
  return result;
};

export const renderWithTheme = (ui: ReactElement) =>
  renderAsync(<ThemeProvider>{ui}</ThemeProvider>);

export const renderScreen = (ui: ReactElement) =>
  renderAsync(<AppProviders>{ui}</AppProviders>);

// A navigation prop stand-in for screen tests.
export const mockNavigation = () =>
  ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    canGoBack: jest.fn(() => true),
  } as any);
