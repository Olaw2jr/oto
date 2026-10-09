import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import ClubScreen from '../../app/features/club/ClubScreen';
import FollowingScreen from '../../app/features/following/FollowingScreen';
import UpdateComposeScreen from '../../app/features/following/UpdateComposeScreen';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });

describe('FollowingScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <FollowingScreen
        navigation={navigation}
        route={{key: 'F', name: 'Following'} as any}
      />,
    );
    return navigation;
  };

  it('shows what friends are listening to', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Following'})).toBeOnTheScreen();
    expect(screen.getAllByText('Mika T.').length).toBeGreaterThan(0);
    expect(screen.getByText('started listening')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'He writes about the cosmos like a room you can walk into.',
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Wait until the chapter on borders.'),
    ).toBeOnTheScreen();
  });

  it('likes a post and adds its book to your want list', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Like, 12 likes'}));
    expect(
      screen.getByRole('button', {name: 'Unlike, 13 likes'}),
    ).toBeOnTheScreen();

    // Amani is already listening to Mika's book.
    expect(screen.getByText("You're listening")).toBeOnTheScreen();
    await press(
      screen.getByRole('button', {name: 'Add Tuesdays with Morrie to want'}),
    );
    expect(screen.getByText('On your want list')).toBeOnTheScreen();
  });

  it('filters to reviews and club posts', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Reviews'}));
    expect(screen.queryByText('Mika T.')).toBeNull();
    expect(screen.getByText('Zawadi O.')).toBeOnTheScreen();

    await press(screen.getByRole('button', {name: 'Clubs'}));
    expect(screen.getByText('Daniel K.')).toBeOnTheScreen();
    expect(screen.queryByText('Zawadi O.')).toBeNull();
  });

  it('opens the update composer', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'Update your status'}));
    expect(navigation.navigate).toHaveBeenCalledWith(
      'UpdateCompose',
      undefined,
    );
  });
});

describe('UpdateComposeScreen', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <>
        <UpdateComposeScreen
          navigation={navigation}
          route={{key: 'U', name: 'UpdateCompose', params: undefined} as any}
        />
        <FollowingScreen
          navigation={mockNavigation()}
          route={{key: 'F', name: 'Following'} as any}
        />
      </>,
    );
    return navigation;
  };

  it('posts an update with status, progress, rating and thoughts', async () => {
    const navigation = await setup();
    expect(screen.getByText('Your update')).toBeOnTheScreen();
    expect(
      screen.getAllByText('Where the Crawdads Sing').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/^28% · Ch\. 14$/)).toBeOnTheScreen();

    await press(screen.getByRole('button', {name: '4 stars'}));
    expect(
      screen.getByRole('button', {name: '4 stars'}),
    ).toHaveAccessibilityState({selected: true});

    fireEvent.changeText(
      screen.getByLabelText('Thoughts'),
      'The marsh is the main character.',
    );
    expect(
      screen.getByRole('switch', {name: 'Share to Quiet Pages'}),
    ).toHaveAccessibilityState({
      checked: true,
    });

    await press(screen.getByRole('button', {name: 'Post update'}));
    expect(navigation.goBack).toHaveBeenCalled();
    expect(
      screen.getByText('The marsh is the main character.'),
    ).toBeOnTheScreen();
  });

  it('nudges progress and changes the book', async () => {
    await setup();
    const progress = screen.getByRole('adjustable', {name: 'Where are you?'});
    fireEvent(progress, 'accessibilityAction', {
      nativeEvent: {actionName: 'increment'},
    });
    expect(screen.getByText(/^29% · Ch\. \d+$/)).toBeOnTheScreen();

    await press(screen.getByRole('button', {name: 'Change book'}));
    expect(screen.getAllByText('Starry Messenger').length).toBeGreaterThan(0);
  });

  it('will not post an empty update', async () => {
    await setup();
    expect(
      screen.getByRole('button', {name: 'Post update'}),
    ).toHaveAccessibilityState({
      disabled: true,
    });
  });

  it('cancels', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'Cancel'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

describe('ClubScreen', () => {
  const setup = async (asTab = false) => {
    const navigation = mockNavigation();
    await renderScreen(
      <ClubScreen
        navigation={navigation}
        route={
          {
            key: 'C',
            name: asTab ? 'Clubs' : 'Club',
            params: {clubId: 'quiet-pages'},
          } as any
        }
      />,
    );
    return navigation;
  };

  it('shows the club, this month and the next session', async () => {
    await setup();
    expect(screen.getByRole('header', {name: 'Quiet Pages'})).toBeOnTheScreen();
    expect(
      screen.getByText('Slow listening, literary fiction · 214 members'),
    ).toBeOnTheScreen();
    expect(screen.getByText('This month')).toBeOnTheScreen();
    expect(
      screen.getByText("Part II by 18 Oct · you're on chapter 14"),
    ).toBeOnTheScreen();
    expect(screen.getByText('Club 46%')).toBeOnTheScreen();
    expect(screen.getByText('Thursday 8 Oct · 8:00 PM')).toBeOnTheScreen();
    expect(screen.getByText('Chapter 14 · 12 going')).toBeOnTheScreen();
  });

  // Replies have no screen yet, so the count mustn't look like an action.
  it('shows reply counts as plain text', async () => {
    await setup();
    expect(screen.queryByText(/^Reply · /)).toBeNull();
    expect(screen.getAllByText(/^\d+ repl(y|ies)$/).length).toBeGreaterThan(0);
  });

  it('RSVPs and leaves/joins', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'RSVP'}));
    expect(screen.getByText('Chapter 14 · 13 going')).toBeOnTheScreen();
    expect(screen.getByRole('button', {name: 'Going'})).toBeOnTheScreen();

    await press(screen.getByRole('button', {name: 'Joined'}));
    expect(screen.getByRole('button', {name: 'Join'})).toBeOnTheScreen();
  });

  it('hides discussion ahead of you while spoiler-safe', async () => {
    await setup();
    const safe = screen.getByRole('switch', {
      name: 'Spoiler-safe to where you are',
    });
    expect(safe).toHaveAccessibilityState({checked: true});
    expect(
      screen.queryByText(
        'The trial chapters reframe everything. No spoilers, but hold on.',
      ),
    ).toBeNull();
    expect(screen.getByText('1 post ahead of you is hidden')).toBeOnTheScreen();

    await press(safe);
    expect(
      screen.getByText(
        'The trial chapters reframe everything. No spoilers, but hold on.',
      ),
    ).toBeOnTheScreen();
  });

  it('jumps to a timestamp in the player', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'Play from 3:12:12'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Player');
  });

  it('adds to the discussion', async () => {
    await setup();
    fireEvent.changeText(
      screen.getByLabelText('Add to the discussion'),
      'See you Thursday.',
    );
    await press(screen.getByRole('button', {name: 'Send'}));
    expect(screen.getByText('See you Thursday.')).toBeOnTheScreen();
  });

  it('only shows a back button when opened from elsewhere', async () => {
    await setup(true);
    expect(screen.queryByRole('button', {name: 'Back'})).toBeNull();
  });
});
