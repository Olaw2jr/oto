import React from 'react';
import {StyleSheet} from 'react-native';
import {screen} from '@testing-library/react-native';

import {Chip, Pill} from '../../app/ui';
import {renderWithTheme} from '../test-utils';

const flat = (style: unknown) => StyleSheet.flatten(style as any) ?? {};

// Labels must be centred by their container, not by lineHeight tricks that
// Android's font padding throws off (issue #15).
const expectCentred = (label: string) => {
  const text = screen.getAllByText(label)[0];
  expect(flat(text.props.style)).toMatchObject({
    includeFontPadding: false,
    textAlignVertical: 'center',
  });
  expect(flat(text.props.style).height).toBeUndefined();
  expect(flat(text.props.style).lineHeight).toBeUndefined();

  let node = text.parent;
  while (node && (node.type as unknown) !== 'View') {
    node = node.parent;
  }
  const box = flat(node?.props.style);
  expect(box).toMatchObject({alignItems: 'center', justifyContent: 'center'});
  expect(box.height).toBeGreaterThan(0);
};

describe('Pill', () => {
  it('centres its label in a fixed-height box', async () => {
    await renderWithTheme(<Pill label="Listening" height={36} />);
    expectCentred('Listening');
  });
});

describe('Chip', () => {
  it('centres its label', async () => {
    await renderWithTheme(<Chip label="Titles" onPress={jest.fn()} />);
    expectCentred('Titles');
  });
});

describe('pills across screens', () => {
  const {mockNavigation, renderScreen} = require('../test-utils');
  const route = (name: string, params?: object) =>
    ({key: name, name, params} as any);

  it('centres the Follow pill on Search', async () => {
    const SearchScreen =
      require('../../app/features/search/SearchScreen').default;
    await renderScreen(
      <SearchScreen navigation={mockNavigation()} route={route('Search')} />,
    );
    expectCentred('Follow');
  });

  it('centres the genre chips on Book details', async () => {
    const BookDetailsScreen =
      require('../../app/features/book/BookDetailsScreen').default;
    await renderScreen(
      <BookDetailsScreen
        navigation={mockNavigation()}
        route={route('BookDetails', {bookId: 'fire-blood-hbo-tie-in-edition'})}
      />,
    );
    expectCentred('Epic');
  });

  it('centres the status pills on Onboarding', async () => {
    const {act, fireEvent} = require('@testing-library/react-native');
    const OnboardingScreen =
      require('../../app/features/welcome/OnboardingScreen').default;
    await renderScreen(
      <OnboardingScreen
        navigation={mockNavigation()}
        route={route('Onboarding')}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByRole('button', {name: 'Continue'}));
    });
    expectCentred('Listening');
  });
});
