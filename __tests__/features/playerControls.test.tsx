import React from 'react';
import {
  act,
  fireEvent,
  renderHook,
  screen,
} from '@testing-library/react-native';

import PlayerScreen from '../../app/features/player/PlayerScreen';
import {getBook} from '../../app/data/catalogue';
import {LibraryProvider} from '../../app/state/library';
import {PlayerProvider, usePlayer} from '../../app/state/player';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const route = {key: 'Player', name: 'Player'} as any;

describe('sleep timer state', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <LibraryProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </LibraryProvider>
  );

  it('pauses after the chosen minutes', () => {
    const {result} = renderHook(() => usePlayer(), {wrapper});
    act(() => result.current.toggle());
    act(() => result.current.setSleepTimer({kind: 'minutes', minutes: 15}));
    expect(result.current.sleepTimer).toMatchObject({
      kind: 'minutes',
      minutes: 15,
    });

    act(() => jest.advanceTimersByTime(14 * 60 * 1000));
    expect(result.current.playing).toBe(true);
    act(() => jest.advanceTimersByTime(60 * 1000));
    expect(result.current.playing).toBe(false);
    expect(result.current.sleepTimer).toBeNull();
  });

  it('pauses at the end of the chapter', () => {
    const {result} = renderHook(() => usePlayer(), {wrapper});
    const book = getBook('where-the-crawdads-sing');
    const chapterLength = book.durationSec / book.chapters;
    const chapterEnd =
      Math.ceil(result.current.position / chapterLength) * chapterLength;

    act(() => result.current.seekTo(chapterEnd - 3));
    act(() => result.current.toggle());
    act(() => result.current.setSleepTimer({kind: 'chapter'}));
    act(() => jest.advanceTimersByTime(5000));

    expect(result.current.playing).toBe(false);
    expect(result.current.position).toBeLessThanOrEqual(chapterEnd + 1);
  });

  it('can be turned off', () => {
    const {result} = renderHook(() => usePlayer(), {wrapper});
    act(() => result.current.toggle());
    act(() => result.current.setSleepTimer({kind: 'minutes', minutes: 15}));
    act(() => result.current.setSleepTimer(null));
    act(() => jest.advanceTimersByTime(20 * 60 * 1000));
    expect(result.current.playing).toBe(true);
  });
});

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
