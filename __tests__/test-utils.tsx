import React, {ReactElement} from 'react';
import {act, render} from '@testing-library/react-native';

import {TailwindProvider} from '../app/theme/TailwindProvider';
import {ThemeProvider} from '../app/theme/ThemeProvider';
import utilities from '../tailwind.json';

// tailwind-rn and the providers resolve state asynchronously after mount;
// flush those updates so tests don't trip act() warnings.
export const renderAsync = async (ui: ReactElement) => {
  const result = render(ui);
  await act(async () => {});
  return result;
};

export const renderWithProviders = (ui: ReactElement) =>
  renderAsync(<TailwindProvider utilities={utilities}>{ui}</TailwindProvider>);

export const renderWithTheme = (ui: ReactElement) =>
  renderAsync(<ThemeProvider>{ui}</ThemeProvider>);
