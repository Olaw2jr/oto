import type {BookId} from './library';

export type SocialActivityKind =
  | 'want'
  | 'listening'
  | 'progress'
  | 'finished'
  | 'review'
  | 'club';

export type SocialActivity = {
  id: string;
  bookId: BookId;
  actorId: string;
  kind: SocialActivityKind;
  body: string;
  createdAt: string;
};
