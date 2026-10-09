import React from 'react';
import {act, renderHook} from '@testing-library/react-native';

import {InMemoryCollectionsRepository} from '../../app/adapters/library';
import {LibraryProvider, useLibrary} from '../../app/state/library';

describe('LibraryProvider collections', () => {
  const setup = () => {
    const repository = new InMemoryCollectionsRepository({
      ratings: {'greenlights': 4},
      shelves: [{id: 'quiet', name: 'Quiet', bookIds: ['greenlights']}],
      bookmarks: {'greenlights': [12]},
    });
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <LibraryProvider
        collections={{repository, initial: repository.snapshot()}}>
        {children}
      </LibraryProvider>
    );
    const {result} = renderHook(() => useLibrary(), {wrapper});
    return {repository, result};
  };

  it('starts from the stored ratings, shelves and bookmarks', () => {
    const {result} = setup();
    expect(result.current.rating('greenlights')).toBe(4);
    expect(result.current.shelf('quiet')).toMatchObject({
      name: 'Quiet',
      bookIds: ['greenlights'],
      custom: true,
    });
    expect(result.current.bookmarks('greenlights')).toEqual([12]);
  });

  it('saves every change', async () => {
    const {repository, result} = setup();
    await act(async () => {
      result.current.setRating('greenlights', undefined);
      result.current.setRating('starry-messenger', 5);
      result.current.toggleOnShelf('quiet', 'starry-messenger');
      result.current.toggleOnShelf('quiet', 'greenlights');
      result.current.addBookmark('greenlights', 3.7);
      result.current.addBookmark('greenlights', 30);
      result.current.removeBookmark('greenlights', 30);
    });
    let id = '';
    await act(async () => {
      id = result.current.createShelf('Road trips', 'greenlights');
    });

    expect(repository.snapshot()).toEqual({
      ratings: {'starry-messenger': 5},
      shelves: [
        {id: 'quiet', name: 'Quiet', bookIds: ['starry-messenger']},
        {id, name: 'Road trips', bookIds: ['greenlights']},
      ],
      bookmarks: {'greenlights': [3, 12]},
    });
  });
});
