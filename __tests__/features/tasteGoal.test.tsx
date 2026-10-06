import React from 'react';
import {Text} from 'react-native';
import {act, fireEvent, screen} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DiscoverScreen from '../../app/features/discover/DiscoverScreen';
import OnboardingScreen from '../../app/features/welcome/OnboardingScreen';
import YouScreen from '../../app/features/you/YouScreen';
import {ProgressBar} from '../../app/ui/ProgressBar';
import {useLibrary} from '../../app/state/library';
import {useSocial} from '../../app/state/social';
import {TASTE_STORAGE_KEY} from '../../app/state/taste';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const route = (name: string) => ({key: name, name} as any);

beforeEach(() => AsyncStorage.clear());

describe('taste picker in onboarding', () => {
  const toTaste = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <OnboardingScreen navigation={navigation} route={route('Onboarding')} />,
    );
    for (let i = 0; i < 3; i++) {
      await press(
        screen.getByRole('button', {name: /^(Continue|Get started)$/}),
      );
    }
    return navigation;
  };

  it('comes after the three intro steps', async () => {
    await toTaste();
    expect(
      screen.getByRole('header', {name: 'What do you like?'}),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Step 4 of 4')).toBeOnTheScreen();
  });

  it('saves genres and follows authors you pick', async () => {
    const Follows = () => {
      const social = useSocial();
      return (
        <Text>
          {social.followsAuthor('Andy Weir')
            ? 'following weir'
            : 'not following'}
        </Text>
      );
    };
    const navigation = mockNavigation();
    await renderScreen(
      <>
        <Follows />
        <OnboardingScreen navigation={navigation} route={route('Onboarding')} />
      </>,
    );
    for (let i = 0; i < 3; i++) {
      await press(
        screen.getByRole('button', {name: /^(Continue|Get started)$/}),
      );
    }
    await press(screen.getByRole('button', {name: 'Science fiction'}));
    await press(screen.getByRole('button', {name: 'Andy Weir'}));
    expect(
      screen.getByRole('button', {name: 'Science fiction'}),
    ).toHaveAccessibilityState({selected: true});

    await press(screen.getByRole('button', {name: 'Get started'}));
    expect(navigation.replace).toHaveBeenCalledWith('SignUp');
    expect(
      JSON.parse((await AsyncStorage.getItem(TASTE_STORAGE_KEY))!),
    ).toEqual({
      genres: ['Science fiction'],
      authors: ['Andy Weir'],
    });
    expect(screen.getByText('following weir')).toBeOnTheScreen();
  });

  it('can be skipped', async () => {
    const navigation = await toTaste();
    await press(screen.getByRole('button', {name: 'Skip'}));
    expect(navigation.replace).toHaveBeenCalledWith('SignUp');
  });
});

describe('Discover picks for your taste', () => {
  it('shows picks for the genres you chose', async () => {
    await AsyncStorage.setItem(
      TASTE_STORAGE_KEY,
      JSON.stringify({genres: ['Science fiction'], authors: []}),
    );
    await renderScreen(
      <DiscoverScreen
        navigation={mockNavigation()}
        route={route('Discover')}
      />,
    );
    expect(
      screen.getByRole('header', {name: 'Picked for your taste'}),
    ).toBeOnTheScreen();
    expect(
      // The pick, not the Trending row with the same book.
      screen.getByRole('button', {name: 'Project Hail Mary, Andy Weir'}),
    ).toBeOnTheScreen();
  });

  it('leaves the row out without a taste', async () => {
    await renderScreen(
      <DiscoverScreen
        navigation={mockNavigation()}
        route={route('Discover')}
      />,
    );
    expect(
      screen.queryByRole('header', {name: 'Picked for your taste'}),
    ).toBeNull();
  });
});

describe('listening goal', () => {
  const year = new Date().getFullYear();

  it('shows progress towards the yearly goal', async () => {
    await renderScreen(
      <YouScreen navigation={mockNavigation()} route={route('You')} />,
    );
    expect(screen.getByText(`${year} goal`)).toBeOnTheScreen();
    expect(screen.getByText('9 of 12 books')).toBeOnTheScreen();
    const progress = screen
      .UNSAFE_getAllByType(ProgressBar)
      .find(node => node.props.label === `${year} listening goal`);
    expect(progress?.props).toMatchObject({
      value: 0.75,
      label: `${year} listening goal`,
    });
  });

  it('counts books you finish', async () => {
    const Finish = () => {
      const library = useLibrary();
      return (
        <Text
          onPress={() => library.setStatus('project-hail-mary', 'finished')}>
          finish
        </Text>
      );
    };
    await renderScreen(
      <>
        <Finish />
        <YouScreen navigation={mockNavigation()} route={route('You')} />
      </>,
    );
    await press(screen.getByText('finish'));
    expect(screen.getByText('10 of 12 books')).toBeOnTheScreen();
  });

  it('changes the goal', async () => {
    await renderScreen(
      <YouScreen navigation={mockNavigation()} route={route('You')} />,
    );
    await press(
      screen.getByRole('button', {name: `Change ${year} goal, 12 books`}),
    );
    await press(screen.getByRole('radio', {name: '24 books'}));
    expect(screen.getByText('9 of 24 books')).toBeOnTheScreen();
  });
});
