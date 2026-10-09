import React from 'react';
import {Pressable, View} from 'react-native';
import {render, screen} from '@testing-library/react-native';

import {mockNavigation, renderScreen} from '../test-utils';

// HA-01: every control on every screen has a role and a name screen readers
// can announce. Renders each screen and inspects the host tree.
const route = (name: string, params?: object) => ({key: name, name, params} as any);

// Every row has params: a missing third column would make Jest treat the
// third argument as a done callback.
const screens: Array<[string, () => React.ComponentType<any>, object]> = [
  ['Home', () => require('../../app/features/home/HomeScreen').default, {}],
  ['Discover', () => require('../../app/features/discover/DiscoverScreen').default, {}],
  ['Following', () => require('../../app/features/following/FollowingScreen').default, {}],
  ['Clubs', () => require('../../app/features/club/ClubScreen').default, {clubId: 'quiet-pages'}],
  ['You', () => require('../../app/features/you/YouScreen').default, {}],
  ['Book', () => require('../../app/features/book/BookScreen').default, {bookId: 'where-the-crawdads-sing'}],
  ['BookDetails', () => require('../../app/features/book/BookDetailsScreen').default, {bookId: 'where-the-crawdads-sing'}],
  ['Reviews', () => require('../../app/features/book/ReviewsScreen').default, {bookId: 'where-the-crawdads-sing'}],
  ['Player', () => require('../../app/features/player/PlayerScreen').default, {}],
  ['Thread', () => require('../../app/features/following/ThreadScreen').default, {itemId: 'f1'}],
  ['UpdateCompose', () => require('../../app/features/following/UpdateComposeScreen').default, {}],
  ['Search', () => require('../../app/features/search/SearchScreen').default, {}],
  ['Catalog', () => require('../../app/features/library/CatalogScreen').default, {}],
  ['Library', () => require('../../app/features/library/LibraryScreen').default, {}],
  ['Shelf', () => require('../../app/features/library/ShelfScreen').default, {shelfId: 'quiet-nights'}],
  ['SaveToShelf', () => require('../../app/features/library/SaveToShelfScreen').default, {bookId: 'greenlights'}],
  ['Mood', () => require('../../app/features/discover/MoodScreen').default, {mood: 'Quiet evening'}],
  ['Person', () => require('../../app/features/profiles/PersonScreen').default, {personId: 'mika'}],
  ['Author', () => require('../../app/features/profiles/AuthorScreen').default, {name: 'Delia Owens'}],
  ['Settings', () => require('../../app/features/settings/SettingsScreen').default, {}],
  ['Onboarding', () => require('../../app/features/welcome/OnboardingScreen').default, {}],
  ['SignIn', () => require('../../app/features/welcome/SignInScreen').default, {}],
  ['SignUp', () => require('../../app/features/welcome/SignUpScreen').default, {}],
];

const textOf = (node: any): string =>
  typeof node === 'string'
    ? node
    : (node?.children ?? []).map(textOf).join(' ').trim();

// A pressable host view: RN's Pressable/Touchable render a View with
// responder handlers and an onClick.
const isControl = (node: any) =>
  node?.type === 'View' && typeof node.props?.onClick === 'function';

const problems = (root: any) => {
  const found: string[] = [];
  const visit = (node: any) => {
    if (!node || typeof node === 'string') return;
    if (isControl(node)) {
      const name = node.props.accessibilityLabel ?? textOf(node);
      if (!node.props.accessibilityRole) {
        found.push(`control without a role: "${name || '(unnamed)'}"`);
      }
      if (!name) {
        found.push(`control without a name (role ${node.props.accessibilityRole})`);
      }
    }
    (node.children ?? []).forEach(visit);
  };
  visit(root);
  return found;
};

describe('screen accessibility audit', () => {
  it.each(screens)('%s: every control has a role and a name', async (name, load, params) => {
    const Screen = load();
    await renderScreen(<Screen navigation={mockNavigation()} route={route(name, params)} />);
    expect(problems(screen.toJSON())).toEqual([]);
  });
});

describe('the audit itself', () => {
  it('flags controls without a role or a name', () => {
    render(
      <View>
        <Pressable onPress={() => {}}>
          <View />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Play" onPress={() => {}} />
      </View>,
    );
    expect(problems(screen.toJSON())).toEqual([
      'control without a role: "(unnamed)"',
      'control without a name (role undefined)',
    ]);
  });
});

