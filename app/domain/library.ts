export type BookId = string;
export type ShelfId = string;

export type LibraryStatus = 'want' | 'listening' | 'finished';

export type LibraryEntry = {
  bookId: BookId;
  status: LibraryStatus;
  positionSec: number;
};

export type ListeningProgress = {
  bookId: BookId;
  renditionId: string;
  chapterId?: string;
  positionSec: number;
  durationSec: number;
};

export const clampPosition = (
  positionSec: number,
  durationSec: number,
): number => Math.min(durationSec, Math.max(0, positionSec));
