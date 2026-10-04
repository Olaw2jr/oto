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

export const profileStats = {
  finished: 41,
  // Finished so far this year, before anything you finish in the app.
  finishedThisYear: 9,
  clubs: 4,
  following: 188,
};

// Last five weeks as on the canvas, oldest first. The final day is today,
// shown in kaki and not counted until it is over.
export const listeningDays = [
  [1, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 0],
]
  .flat()
  .map(Boolean);

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
    // Just before Amani's position (28% of 12 h 12 min ≈ 3:24:58).
    at: 3 * 3600 + 22 * 60 + 12,
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

export type FeedComment = {
  id: string;
  by: string;
  ago: string;
  body: string;
  likes: number;
  // Replies point at the top-level comment they answer.
  parentId?: string;
};

export type FeedItem = {
  id: string;
  by: string;
  ago: string;
  verb:
    | 'started listening'
    | 'finished a book'
    | 'is listening'
    | 'posted in'
    | 'wants to listen'
    | 'rated'
    | 'made progress';
  bookId: string;
  clubId?: string;
  progress?: number;
  rating?: number;
  body: string;
  likes: number;
  comments: FeedComment[];
  spoiler?: boolean;
};

export const feedSeed: FeedItem[] = [
  {
    id: 'f1',
    by: 'mika',
    ago: '2 h ago',
    verb: 'started listening',
    bookId: 'starry-messenger',
    progress: 0.09,
    body: 'He writes about the cosmos like a room you can walk into.',
    likes: 12,
    comments: [
      {
        id: 'f1c1',
        by: 'zawadi',
        ago: '1 h ago',
        body: 'Wait until the chapter on borders.',
        likes: 3,
      },
      {
        id: 'f1c2',
        by: 'daniel',
        ago: '40 min ago',
        body: 'Adding this to my list tonight.',
        likes: 1,
      },
    ],
  },
  {
    id: 'f2',
    by: 'zawadi',
    ago: 'Yesterday',
    verb: 'finished a book',
    bookId: 'tuesdays-with-morrie',
    rating: 4.5,
    body: 'Short, plain and heartbreaking. The kind of book you finish in one sitting.',
    likes: 18,
    comments: [
      {
        id: 'f2c1',
        by: 'mika',
        ago: '3 h ago',
        body: 'The ending is so quiet. Did the last chapter get you?',
        likes: 4,
      },
      {
        id: 'f2c2',
        by: 'zawadi',
        ago: '2 h ago',
        body: 'Almost. I had to pause on the bus.',
        likes: 2,
        parentId: 'f2c1',
      },
      {
        id: 'f2c3',
        by: 'amani',
        ago: '1 h ago',
        body: 'Adding it to my list tonight.',
        likes: 0,
        parentId: 'f2c1',
      },
      {
        id: 'f2c4',
        by: 'daniel',
        ago: '5 h ago',
        body: 'Is it a good first Albom?',
        likes: 1,
      },
      {
        id: 'f2c5',
        by: 'ren',
        ago: '6 h ago',
        body: 'Morrie on audio is something else.',
        likes: 2,
      },
    ],
  },
  {
    id: 'f3',
    by: 'daniel',
    ago: 'Yesterday',
    verb: 'posted in',
    clubId: 'quiet-pages',
    bookId: 'where-the-crawdads-sing',
    body: 'Slower than I expected, in the best way.',
    likes: 3,
    comments: [],
  },
  {
    id: 'f4',
    by: 'daniel',
    ago: '4 days ago',
    verb: 'wants to listen',
    bookId: 'fire-blood-hbo-tie-in-edition',
    body: '',
    likes: 0,
    comments: [],
  },
  {
    id: 'f5',
    by: 'ren',
    ago: '3 days ago',
    verb: 'rated',
    bookId: 'dreamland',
    rating: 4,
    body: 'Beautifully restrained. I kept wanting to shake the narrator.',
    likes: 6,
    comments: [],
  },
  {
    id: 'f6',
    by: 'mika',
    ago: '3 days ago',
    verb: 'made progress',
    bookId: 'greenlights',
    progress: 0.41,
    body: '',
    likes: 2,
    comments: [],
  },
];

export const recentSearchesSeed = [
  'crawdads',
  'quiet literary novels',
  'Project Hail Mary',
];

export const authorsForYou = [
  'Delia Owens',
  'Andy Weir',
  'Mitch Albom',
  'J. R. R. Tolkien',
  'Matthew McConaughey',
];

export type CustomShelf = {id: string; name: string; bookIds: string[]};

export const shelvesSeed: CustomShelf[] = [
  {
    id: 'quiet-nights',
    name: 'Quiet nights',
    bookIds: ['tuesdays-with-morrie', 'where-the-crawdads-sing'],
  },
  {
    id: 'science',
    name: 'Science',
    bookIds: ['starry-messenger', 'project-hail-mary'],
  },
];

export const editorsPicks = [
  'where-the-crawdads-sing',
  'tuesdays-with-morrie',
  'the-silmarillion',
  'greenlights',
];
