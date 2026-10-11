import React, {useEffect, useRef} from 'react';
import {Text} from 'react-native';
import {act, fireEvent, screen} from '@testing-library/react-native';

import {PUBLIC_DOMAIN_SAMPLE_ID} from '../../app/data/catalogue';
import CarModeScreen from '../../app/features/player/CarModeScreen';
import PlayerScreen from '../../app/features/player/PlayerScreen';
import {useLibrary} from '../../app/state/library';
import {usePlayer} from '../../app/state/player';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const route = (name: string) => ({key: name, name} as any);
const elapsed = () => screen.getByLabelText('Elapsed').props.children;

// The player with the public-domain sample loaded: it has real chapter
// titles and rights-cleared audio that can be downloaded.
const WithSample = ({children}: {children: React.ReactNode}) => {
  const {play} = usePlayer();
  const started = useRef(false);
  useEffect(() => {
    // Once: starting playback marks the book as listening again.
    if (!started.current) {
      started.current = true;
      play(PUBLIC_DOMAIN_SAMPLE_ID);
    }
  }, [play]);
  return <>{children}</>;
};

const LibraryStatus = () => {
  const library = useLibrary();
  return (
    <Text>{`status:${library.status(PUBLIC_DOMAIN_SAMPLE_ID) ?? 'none'}`}</Text>
  );
};

async function openPlayer(withSample = false) {
  const navigation = mockNavigation();
  const player = (
    <PlayerScreen navigation={navigation} route={route('Player')} />
  );
  await renderScreen(
    withSample ? (
      <WithSample>
        {player}
        <LibraryStatus />
      </WithSample>
    ) : (
      player
    ),
  );
  await act(async () => {});
  return navigation;
}

describe('player actions', () => {
  it('labels the speed, car mode, timer and bookmark actions', async () => {
    await openPlayer();
    for (const label of ['Speed', 'Car Mode', 'Timer', 'Bookmark']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
  });

  it('picks a playback speed from a list', async () => {
    await openPlayer();
    await press(screen.getByRole('button', {name: 'Playback speed 1 times'}));
    expect(
      screen.getByRole('header', {name: 'Playback speed'}),
    ).toBeOnTheScreen();
    await press(screen.getByRole('radio', {name: '1.75×'}));
    expect(
      screen.getByRole('button', {name: 'Playback speed 1.75 times'}),
    ).toBeOnTheScreen();
  });

  it('lists chapters by title and jumps to one', async () => {
    await openPlayer(true);
    await press(
      screen.getByRole('button', {name: /^Chapters, chapter 1 of 24/}),
    );
    expect(screen.getByRole('header', {name: 'Chapters'})).toBeOnTheScreen();
    await press(
      screen.getByRole('button', {name: /^The Red-Headed League, Part 1/}),
    );
    // Chapter 3 starts after the two parts of A Scandal in Bohemia.
    expect(elapsed()).toBe('1:07:00');
  });

  it('moves between chapters', async () => {
    await openPlayer(true);
    await press(screen.getByRole('button', {name: 'Next chapter'}));
    expect(elapsed()).toBe('27:50');
    await press(screen.getByRole('button', {name: 'Forward 30 seconds'}));
    // Partway into a chapter, previous goes back to its start first.
    await press(screen.getByRole('button', {name: 'Previous chapter'}));
    expect(elapsed()).toBe('27:50');
    await press(screen.getByRole('button', {name: 'Previous chapter'}));
    expect(elapsed()).toBe('0:00');
  });

  it('opens Car Mode', async () => {
    const navigation = await openPlayer();
    await press(screen.getByRole('button', {name: 'Car Mode'}));
    expect(navigation.navigate).toHaveBeenCalledWith('CarMode');
  });

  it('offers the full menu: details, library, download, finish, rating, settings', async () => {
    const navigation = await openPlayer(true);
    await press(screen.getByRole('button', {name: 'More'}));
    for (const name of [
      'Title details',
      'Share',
      /^Bookmarks/,
      'Mark as finished',
      'Rate and review',
      'Player settings',
      'Download',
    ]) {
      expect(screen.getByRole('button', {name})).toBeOnTheScreen();
    }

    await press(screen.getByRole('button', {name: 'Mark as finished'}));
    expect(screen.getByText('status:finished')).toBeOnTheScreen();

    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Player settings'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
  });

  it('rates the book from the menu', async () => {
    await openPlayer();
    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Rate and review'}));
    expect(
      screen.getByRole('header', {name: 'Rate and review'}),
    ).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: '4 stars'}));
    await press(screen.getByRole('button', {name: 'More'}));
    expect(
      screen.getByRole('button', {name: 'Rate and review, 4 stars'}),
    ).toBeOnTheScreen();
  });
});

describe('Car Mode', () => {
  it('has large controls and an exit', async () => {
    const navigation = mockNavigation();
    await renderScreen(
      <CarModeScreen navigation={navigation} route={route('CarMode')} />,
    );
    for (const name of [
      'Play',
      'Back 30 seconds',
      'Forward 30 seconds',
      'Bookmark this moment',
    ]) {
      expect(screen.getByRole('button', {name})).toBeOnTheScreen();
    }
    await press(screen.getByRole('button', {name: 'Bookmark this moment'}));
    expect(screen.getByText(/^Bookmarked at /)).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Exit Car Mode'}));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
