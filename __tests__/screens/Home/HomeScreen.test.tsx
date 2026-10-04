import React from 'react';
import {screen} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';

import HomeScreen from '../../../app/screens/Home';
import {renderWithProviders} from '../../test-utils';

const navigation = {navigate: jest.fn()} as any;

describe('HomeScreen', () => {
  it('lists the books you are currently listening to', async () => {
    await renderWithProviders(
      <NavigationContainer>
        <HomeScreen navigation={navigation} />
      </NavigationContainer>,
    );

    expect(screen.getByText('Currently listening')).toBeOnTheScreen();
    expect(screen.getByText('Becoming')).toBeOnTheScreen();
  });
});
