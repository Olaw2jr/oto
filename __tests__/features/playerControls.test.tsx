import React from 'react';
import {
  act,
  fireEvent,
  screen,
} from '@testing-library/react-native';

import {createApplicationContainer} from '../../app/composition';
import PlayerScreen from '../../app/features/player/PlayerScreen';
import {PlaybackUnavailableError} from '../../app/player';
import {AppProviders} from '../../app/state/AppProviders';
import {mockNavigation, renderAsync, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const route = {key: 'Player', name: 'Player'} as any;

describe('PlayerScreen controls', () => {
  const setup = async () => {
    const navigation = mockNavigation();
    await renderScreen(<PlayerScreen navigation={navigation} route={route} />);
    return navigation;
  };

  it('sets a sleep timer from a sheet', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Sleep timer'}));
    expect(screen.getByRole('header', {name: 'Sleep timer'})).toBeOnTheScreen();
    await press(screen.getByRole('radio', {name: '30 minutes'}));
    expect(
      screen.getByRole('button', {name: 'Sleep timer, 30 minutes'}),
    ).toBeOnTheScreen();

    await press(screen.getByRole('button', {name: 'Sleep timer, 30 minutes'}));
    await press(screen.getByRole('radio', {name: 'End of chapter'}));
    expect(
      screen.getByRole('button', {name: 'Sleep timer, end of chapter'}),
    ).toBeOnTheScreen();

    await press(
      screen.getByRole('button', {name: 'Sleep timer, end of chapter'}),
    );
    await press(screen.getByRole('radio', {name: 'Off'}));
    expect(screen.getByRole('button', {name: 'Sleep timer'})).toBeOnTheScreen();
  });

  it('bookmarks the moment and lists bookmarks in More', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'Bookmark this moment'}));
    expect(
      screen.getByText(/^Bookmarked at \d+:\d{2}:\d{2}$/),
    ).toBeOnTheScreen();

    await press(screen.getByRole('button', {name: 'More'}));
    expect(
      screen.getByRole('button', {name: 'Bookmarks, 1'}),
    ).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Bookmarks, 1'}));
    expect(
      screen.getAllByRole('button', {name: /^Play from \d+:\d{2}:\d{2}$/}),
    ).toHaveLength(1);
  });

  it('jumps to a bookmark', async () => {
    await setup();
    const elapsed = () => screen.getByLabelText('Elapsed').props.children;
    await press(screen.getByRole('button', {name: 'Bookmark this moment'}));
    const marked = elapsed();
    await press(screen.getByRole('button', {name: 'Forward 30 seconds'}));
    expect(elapsed()).not.toBe(marked);

    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Bookmarks, 1'}));
    await press(screen.getByRole('button', {name: `Play from ${marked}`}));
    expect(elapsed()).toBe(marked);
  });

  it('opens the book from More', async () => {
    const navigation = await setup();
    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'View book'}));
    expect(navigation.navigate).toHaveBeenCalledWith('Book', {
      bookId: 'where-the-crawdads-sing',
    });
  });

  it('closes a sheet', async () => {
    await setup();
    await press(screen.getByRole('button', {name: 'More'}));
    await press(screen.getByRole('button', {name: 'Close'}));
    expect(screen.queryByRole('button', {name: 'View book'})).toBeNull();
  });
});

describe('PlayerScreen playback errors', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('explains why a book will not play and lets you dismiss it', async () => {
    const container = createApplicationContainer({
      createPlayerController: () =>
        Promise.reject(new PlaybackUnavailableError('no rendition')),
    });
    await renderAsync(
      <AppProviders container={container}>
        <PlayerScreen navigation={mockNavigation()} route={route} />
      </AppProviders>,
    );
    await press(screen.getByRole('button', {name: 'Play'}));
    expect(
      screen.getByText("This book isn't available to listen to yet."),
    ).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Dismiss'}));
    expect(
      screen.queryByText("This book isn't available to listen to yet."),
    ).toBeNull();
  });
});

describe('PlayerScreen scrubber', () => {
  const touch = (locationX: number) => ({
    nativeEvent: {locationX, locationY: 10, pageX: locationX, pageY: 0},
  });

  const setupScrubber = async () => {
    await renderScreen(<PlayerScreen navigation={mockNavigation()} route={route} />);
    const scrubber = screen.getByRole('adjustable', {name: 'Position'});
    fireEvent(scrubber, 'layout', {nativeEvent: {layout: {width: 400, height: 30, x: 0, y: 0}}});
    return scrubber;
  };
  const elapsed = () => screen.getByLabelText('Elapsed').props.children;

  it('lets you drag to a new position and seeks when you let go', async () => {
    const {formatClock} = require('../../app/data/format');
    const scrubber = await setupScrubber();
    const duration = 12 * 3600 + 12 * 60; // Where the Crawdads Sing

    expect(scrubber.props.onStartShouldSetResponder()).toBe(true);
    await act(async () => {
      fireEvent(scrubber, 'responderGrant', touch(100));
      fireEvent(scrubber, 'responderMove', touch(300));
    });
    // Previews the drag position before seeking.
    expect(elapsed()).toBe(formatClock(duration * 0.75));

    await act(async () => {
      fireEvent(scrubber, 'responderRelease', touch(300));
    });
    expect(elapsed()).toBe(formatClock(duration * 0.75));
  });

  it('seeks to where you tap', async () => {
    const {formatClock} = require('../../app/data/format');
    const scrubber = await setupScrubber();
    const duration = 12 * 3600 + 12 * 60;

    await act(async () => {
      fireEvent(scrubber, 'responderGrant', touch(200));
      fireEvent(scrubber, 'responderRelease', touch(200));
    });
    expect(elapsed()).toBe(formatClock(duration * 0.5));
  });

  it('keeps the position inside the book when dragged past either end', async () => {
    const {formatClock} = require('../../app/data/format');
    const scrubber = await setupScrubber();

    await act(async () => {
      fireEvent(scrubber, 'responderGrant', touch(-50));
    });
    expect(elapsed()).toBe(formatClock(0));
    await act(async () => {
      fireEvent(scrubber, 'responderRelease', touch(-50));
    });
  });
});
