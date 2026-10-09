import React from 'react';
import {act, renderHook} from '@testing-library/react-native';

import {getBook} from '../../app/data/catalogue';
import {LibraryProvider, useLibrary} from '../../app/state/library';
import {PlayerProvider, usePlayer} from '../../app/state/player';
import {SettingsProvider} from '../../app/state/settings';
import {createTestPlayerController} from '../test-utils';
import {isUuid} from '../../app/sync/ids';

const wrapper = ({children}: {children: React.ReactNode}) => (
  <SettingsProvider>
    <LibraryProvider>
      <PlayerProvider createController={createTestPlayerController}>
        {children}
      </PlayerProvider>
    </LibraryProvider>
  </SettingsProvider>
);

const crawdads = getBook('where-the-crawdads-sing');

describe('library', () => {
  it('starts from the seed and changes a status', () => {
    const {result} = renderHook(() => useLibrary(), {wrapper});

    expect(result.current.status(crawdads.id)).toBe('listening');
    expect(result.current.progress(crawdads.id)).toBeCloseTo(0.28, 2);
    expect(result.current.status('project-hail-mary')).toBeUndefined();

    act(() => result.current.setStatus('project-hail-mary', 'want'));
    expect(result.current.status('project-hail-mary')).toBe('want');
    expect(result.current.byStatus('want')).toContain('project-hail-mary');
  });

  it('marks a finished book as fully listened', () => {
    const {result} = renderHook(() => useLibrary(), {wrapper});
    act(() => result.current.setStatus(crawdads.id, 'finished'));
    expect(result.current.progress(crawdads.id)).toBe(1);
  });
});

describe('player', () => {
  const setup = () =>
    renderHook(() => ({player: usePlayer(), library: useLibrary()}), {wrapper});

  it('resumes the current book paused', () => {
    const {result} = setup();
    expect(result.current.player.book.id).toBe(crawdads.id);
    expect(result.current.player.playing).toBe(false);
    expect(result.current.player.position).toBeCloseTo(
      crawdads.durationSec * 0.28,
      0,
    );
  });

  it('reflects engine play and rate snapshots without a mock clock', async () => {
    const {result} = setup();
    const start = result.current.player.position;

    await act(async () => result.current.player.cycleRate());
    await act(async () => result.current.player.toggle());

    expect(result.current.player.rate).toBe(1.25);
    expect(result.current.player.playing).toBe(true);
    // The fake engine starts a newly resolved queue at zero; elapsed time
    // only changes when the engine emits a progress snapshot.
    expect(result.current.player.position).toBe(0);
    expect(start).toBeGreaterThan(0);
  });

  it('seeks through the controller within the book', async () => {
    const {result} = setup();

    await act(async () => result.current.player.skip(15));
    expect(result.current.player.position).toBeCloseTo(15, 0);
    await act(async () => result.current.player.skip(30));
    expect(result.current.player.position).toBeCloseTo(45, 0);

    await act(async () => result.current.player.skip(-1e9));
    expect(result.current.player.position).toBe(0);
  });

  it('plays another book and marks it as listening', async () => {
    const {result} = setup();
    await act(async () => result.current.player.play('project-hail-mary'));

    expect(result.current.player.book.id).toBe('project-hail-mary');
    expect(result.current.player.playing).toBe(true);
    expect(result.current.library.status('project-hail-mary')).toBe(
      'listening',
    );
  });

  it('cycles playback speed through the controller', async () => {
    const {result} = setup();
    const rates = [1.25, 1.5, 2, 0.75, 1];
    for (const rate of rates) {
      await act(async () => result.current.player.cycleRate());
      expect(result.current.player.rate).toBe(rate);
    }
  });
});

describe('library ratings', () => {
  it('stores your rating for a book', () => {
    const {result} = renderHook(() => useLibrary(), {wrapper});
    expect(result.current.rating('project-hail-mary')).toBeUndefined();
    act(() => result.current.setRating('project-hail-mary', 4));
    expect(result.current.rating('project-hail-mary')).toBe(4);
    act(() => result.current.setRating('project-hail-mary', undefined));
    expect(result.current.rating('project-hail-mary')).toBeUndefined();
  });
});

describe('library shelves', () => {
  it('lists status shelves then custom ones', () => {
    const {result} = renderHook(() => useLibrary(), {wrapper});
    expect(result.current.shelves.map(s => s.id)).toEqual([
      'want',
      'finished',
      'quiet-nights',
      'science',
    ]);
  });

  it('creates shelves with unique ids and toggles books on them', () => {
    const {result} = renderHook(() => useLibrary(), {wrapper});
    let first = '';
    let second = '';
    act(() => {
      first = result.current.createShelf('Road trips', 'greenlights');
    });
    act(() => {
      second = result.current.createShelf('Road trips');
    });
    // UUIDs, so the server can tell everyone's shelves apart.
    expect(isUuid(first)).toBe(true);
    expect(isUuid(second)).toBe(true);
    expect(first).not.toBe(second);
    expect(result.current.shelf(first)?.bookIds).toEqual(['greenlights']);

    act(() => result.current.toggleOnShelf(first, 'greenlights'));
    expect(result.current.shelf(first)?.bookIds).toEqual([]);
  });
});
