import type {BookId} from './library';

export type Book = {
  id: BookId;
  title: string;
  author: string;
  narrator: string;
  durationSec: number;
  chapters: number;
};
