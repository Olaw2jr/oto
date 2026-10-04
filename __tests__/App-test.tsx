import React from 'react';
import {screen} from '@testing-library/react-native';

import App from '../App';
import {renderAsync} from './test-utils';

describe('App', () => {
  it('renders the main tab bar', async () => {
    await renderAsync(<App />);

    expect(screen.getByText('Discover')).toBeOnTheScreen();
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
  });
});
