// Mock social data following the oto design canvas.

export type Status = 'want' | 'listening' | 'finished';

export const CURRENT_BOOK = 'where-the-crawdads-sing';

// Library seed: what Amani is listening to, wants and has finished.
export const librarySeed: Record<string, {status: Status; position?: number}> =
  {
    'where-the-crawdads-sing': {status: 'listening', position: 0.28},
    'starry-messenger': {status: 'listening', position: 0.09},
    'the-lost-book-of-eleanor-dare': {status: 'listening', position: 0.62},
    'the-silmarillion': {status: 'want'},
    'atomic-habits': {status: 'finished', position: 1},
    greenlights: {status: 'finished', position: 1},
  };

export const profileStats = {finished: 41, clubs: 4, following: 188};

// Last five weeks, oldest first; the last day is today.
export const listeningDays = [
  1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1,
  1, 1, 1, 1, 1, 0, 1, 1, 1,
].map(Boolean);

export type MarginNote = {
  id: string;
  bookId: string;
  by: string;
  at: number;
  body: string;
};

export const marginNotes: MarginNote[] = [
  {
    id: 'n1',
    bookId: 'where-the-crawdads-sing',
    by: 'mika',
    at: 3 * 3600 + 12 * 60 + 12,
    body: 'Read this passage twice. It changes everything that came before.',
  },
  {
    id: 'n2',
    bookId: 'where-the-crawdads-sing',
    by: 'zawadi',
    at: 3 * 3600 + 14 * 60 + 2,
    body: 'The marsh as a character, not a setting.',
  },
  {
    id: 'n3',
    bookId: 'where-the-crawdads-sing',
    by: 'daniel',
    at: 3 * 3600 + 9 * 60 + 40,
    body: 'Slower than I expected, in the best way.',
  },
];

export type Review = {
  id: string;
  bookId: string;
  by: string;
  rating: number;
  body: string;
  likes: number;
  comments: number;
};

export const reviews: Review[] = [
  {
    id: 'r1',
    bookId: 'where-the-crawdads-sing',
    by: 'zawadi',
    rating: 5,
    body: 'Ends quietly and stays with you. The second half is the whole book.',
    likes: 24,
    comments: 6,
  },
  {
    id: 'r2',
    bookId: 'project-hail-mary',
    by: 'daniel',
    rating: 4.5,
    body: 'Funny, warm and impossible to stop. Ray Porter is the whole cast.',
    likes: 31,
    comments: 9,
  },
];

// Who you follow is listening to each book.
export const listeners: Record<string, {people: string[]; others: number}> = {
  'where-the-crawdads-sing': {people: ['mika', 'zawadi', 'daniel'], others: 6},
  'project-hail-mary': {people: ['daniel'], others: 3},
};

export const trending: {bookId: string; note: string}[] = [
  {bookId: 'the-silmarillion', note: 'Mika, Zawadi and 5 others listening'},
  {bookId: 'project-hail-mary', note: 'Daniel and 3 others finished'},
  {bookId: 'fire-blood-hbo-tie-in-edition', note: 'Ren and 2 others listening'},
];

export const becauseYouFinished = {
  bookId: 'atomic-habits',
  picks: [
    'greenlights',
    'project-hail-mary',
    'the-subtle-art-of-not-giving-a-f-ck',
  ],
};

export const discoverFilters = [
  'For you',
  'Short listens',
  'Fiction',
  'Memoir',
  'Science',
];

export const moods: {
  label: string;
  shape: 'circle' | 'arc' | 'dots' | 'moon';
}[] = [
  {label: 'Quiet evening', shape: 'circle'},
  {label: 'Long drive', shape: 'arc'},
  {label: 'Commute', shape: 'dots'},
  {label: 'Falling asleep', shape: 'moon'},
];

export const homeFriendActivity = {
  by: 'mika',
  verb: 'finished',
  bookId: 'it-ends-with-us',
  quote: 'Quiet, devastating, perfectly paced.',
};
