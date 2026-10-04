import React from 'react';
import {act, renderHook} from '@testing-library/react-native';

import {SocialProvider, useSocial} from '../../app/state/social';

const wrapper = ({children}: {children: React.ReactNode}) => (
  <SocialProvider>{children}</SocialProvider>
);

describe('social state', () => {
  it('toggles likes and counts them', () => {
    const {result} = renderHook(() => useSocial(), {wrapper});
    expect(result.current.liked('f1')).toBe(false);
    act(() => result.current.toggleLike('f1'));
    expect(result.current.liked('f1')).toBe(true);
    expect(result.current.likeCount('f1', 12)).toBe(13);
  });

  it('puts your updates at the top of the feed', () => {
    const {result} = renderHook(() => useSocial(), {wrapper});
    act(() =>
      result.current.postUpdate({
        bookId: 'where-the-crawdads-sing',
        status: 'listening',
        progress: 0.3,
        body: 'The marsh is the main character.',
        spoiler: false,
        shareToClub: true,
      }),
    );
    const [first] = result.current.feed;
    expect(first).toMatchObject({
      by: 'amani',
      ago: 'Just now',
      body: 'The marsh is the main character.',
    });
    expect(result.current.clubPosts('quiet-pages')[0].body).toBe(
      'The marsh is the main character.',
    );
  });

  it('tracks club membership, RSVP and discussion', () => {
    const {result} = renderHook(() => useSocial(), {wrapper});
    expect(result.current.joined('quiet-pages')).toBe(true);
    act(() => result.current.toggleJoined('quiet-pages'));
    expect(result.current.joined('quiet-pages')).toBe(false);

    expect(result.current.going('quiet-pages')).toBe(false);
    act(() => result.current.toggleGoing('quiet-pages'));
    expect(result.current.going('quiet-pages')).toBe(true);

    act(() => result.current.addClubPost('quiet-pages', 'Chapter 14 tonight?'));
    expect(result.current.clubPosts('quiet-pages')[0]).toMatchObject({
      by: 'amani',
      body: 'Chapter 14 tonight?',
    });
  });
});

describe('feed comments', () => {
  it('adds comments and replies to a post', () => {
    const {result} = renderHook(() => useSocial(), {wrapper});
    expect(result.current.comments('f2')).toHaveLength(5);

    act(() => result.current.addComment('f2', 'Me too.', 'f2c1'));
    act(() => result.current.addComment('f2', 'New thought.'));

    const all = result.current.comments('f2');
    expect(all).toHaveLength(7);
    expect(all.find(c => c.body === 'Me too.')).toMatchObject({
      by: 'amani',
      parentId: 'f2c1',
    });
    expect(all.find(c => c.body === 'New thought.')?.parentId).toBeUndefined();
  });
});
