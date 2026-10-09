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

// A shelf you made, with its books in the order you added them.
export type ShelfRecord = {
  id: ShelfId;
  name: string;
  bookIds: BookId[];
};

// What you keep about books beyond their status: your star ratings, your own
// shelves and bookmarked moments (whole seconds, earliest first).
export type PersonalCollections = {
  ratings: Record<BookId, number>;
  shelves: ShelfRecord[];
  bookmarks: Record<BookId, number[]>;
};
