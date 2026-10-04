import React, {ReactElement} from 'react';
import {act, render} from '@testing-library/react-native';

import {TailwindProvider} from '../app/theme/TailwindProvider';
import utilities from '../tailwind.json';

// tailwind-rn resolves accessibility settings asynchronously after mount;
// flush those updates so tests don't trip act() warnings.
export const renderAsync = async (ui: ReactElement) => {
  const result = render(ui);
  await act(async () => {});
  return result;
};

export const renderWithProviders = (ui: ReactElement) =>
  renderAsync(<TailwindProvider utilities={utilities}>{ui}</TailwindProvider>);
