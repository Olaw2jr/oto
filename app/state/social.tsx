import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {ClubPost, clubs, MY_CLUB} from '../data/clubs';
import {ME} from '../data/people';
import {FeedItem, feedSeed, Status} from '../data/social';

export type NewUpdate = {
  bookId: string;
  status: Status;
  progress: number;
  rating?: number;
  body: string;
  noteAt?: number;
  spoiler: boolean;
  shareToClub: boolean;
};

type SocialValue = {
  feed: FeedItem[];
  liked: (id: string) => boolean;
  likeCount: (id: string, base: number) => number;
  toggleLike: (id: string) => void;
  postUpdate: (update: NewUpdate) => void;
  joined: (clubId: string) => boolean;
  toggleJoined: (clubId: string) => void;
  going: (clubId: string) => boolean;
  toggleGoing: (clubId: string) => void;
  clubPosts: (clubId: string) => ClubPost[];
  addClubPost: (clubId: string, body: string, at?: number) => void;
};

const SocialContext = createContext<SocialValue | null>(null);

const toggle = (set: Set<string>, id: string) => {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
};

const verbFor = (status: Status): FeedItem['verb'] =>
  status === 'finished' ? 'finished a book' : 'is listening';

export const SocialProvider = ({children}: {children: ReactNode}) => {
  const [feed, setFeed] = useState<FeedItem[]>(feedSeed);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [left, setLeft] = useState<Set<string>>(new Set());
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<Record<string, ClubPost[]>>(() =>
    Object.fromEntries(clubs.map(c => [c.id, c.posts])),
  );

  const addClubPost = useCallback(
    (clubId: string, body: string, at?: number) =>
      setPosts(current => ({
        ...current,
        [clubId]: [
          {
            id: `mine-${Date.now()}`,
            by: ME,
            ago: 'Just now',
            at,
            body,
            likes: 0,
            replies: 0,
          },
          ...(current[clubId] ?? []),
        ],
      })),
    [],
  );

  const postUpdate = useCallback(
    (update: NewUpdate) => {
      setFeed(current => [
        {
          id: `mine-${Date.now()}`,
          by: ME,
          ago: 'Just now',
          verb: verbFor(update.status),
          bookId: update.bookId,
          progress: update.progress,
          rating: update.rating,
          body: update.body,
          likes: 0,
          replies: [],
          spoiler: update.spoiler,
        },
        ...current,
      ]);
      if (update.shareToClub) {
        addClubPost(MY_CLUB, update.body, update.noteAt);
      }
    },
    [addClubPost],
  );

  const value = useMemo<SocialValue>(
    () => ({
      feed,
      liked: id => likes.has(id),
      likeCount: (id, base) => base + (likes.has(id) ? 1 : 0),
      toggleLike: id => setLikes(s => toggle(s, id)),
      postUpdate,
      joined: id => !left.has(id),
      toggleJoined: id => setLeft(s => toggle(s, id)),
      going: id => rsvps.has(id),
      toggleGoing: id => setRsvps(s => toggle(s, id)),
      clubPosts: id => posts[id] ?? [],
      addClubPost,
    }),
    [feed, likes, left, rsvps, posts, postUpdate, addClubPost],
  );

  return (
    <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
  );
};

export const useSocial = () => {
  const value = useContext(SocialContext);
  if (!value) {
    throw new Error('useSocial must be used inside a SocialProvider');
  }
  return value;
};
