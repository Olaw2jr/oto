import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react-native';

import {FakeAudioEngine} from '../../app/audio';
import {getBook} from '../../app/data/catalogue';
import {seedRenditionId} from '../../app/adapters/library';
import {PlayerController} from '../../app/player';
import {LibraryProvider} from '../../app/state/library';
import {PlayerProvider, usePlayer} from '../../app/state/player';
import {SettingsProvider} from '../../app/state/settings';

describe('PlayerProvider AudioEngine path', () => {
  it('derives playback state, position and rate from PlayerController snapshots', async () => {
    const book = getBook('where-the-crawdads-sing');
    const engine = new FakeAudioEngine();
    const controller = new PlayerController(engine);
    await controller.load([
      {
        id: `${book.id}:chapter-1`,
        bookId: book.id,
        renditionId: seedRenditionId(book.id),
        chapterId: `${book.id}:chapter-1`,
        title: 'Chapter 1',
        durationSec: book.durationSec,
        source: {
          kind: 'remote',
          uri: 'https://example.test/book.mp3',
        },
      },
    ], {positionSec: 30});

    const wrapper = ({children}: {children: React.ReactNode}) => (
      <SettingsProvider>
        <LibraryProvider>
          <PlayerProvider controller={controller}>{children}</PlayerProvider>
        </LibraryProvider>
      </SettingsProvider>
    );
    const {result} = renderHook(() => usePlayer(), {wrapper});

    expect(result.current.position).toBe(30);
    expect(result.current.playing).toBe(false);

    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.playing).toBe(true));

    act(() => result.current.skip(15));
    await waitFor(() => expect(result.current.position).toBe(45));

    act(() => result.current.seekTo(10));
    await waitFor(() => expect(result.current.position).toBe(10));

    act(() => result.current.cycleRate());
    await waitFor(() => expect(result.current.rate).toBe(1.25));

    expect(await engine.getSnapshot()).toMatchObject({
      state: 'playing',
      positionSec: 10,
      rate: 1.25,
    });
  });
});
