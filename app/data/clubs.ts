export type ClubPost = {
  id: string;
  by: string;
  ago: string;
  at?: number;
  body: string;
  likes: number;
  replies: number;
};

export type Club = {
  id: string;
  name: string;
  tagline: string;
  members: number;
  bookId: string;
  deadline: string;
  progress: number;
  listeningNow: number;
  session: {when: string; chapter: number; going: number};
  posts: ClubPost[];
};

export const clubs: Club[] = [
  {
    id: 'quiet-pages',
    name: 'Quiet Pages',
    tagline: 'Slow listening, literary fiction',
    members: 214,
    bookId: 'where-the-crawdads-sing',
    deadline: 'Part II by 18 Oct',
    progress: 0.46,
    listeningNow: 8,
    session: {when: 'Thursday 8 Oct · 8:00 PM', chapter: 14, going: 12},
    posts: [
      {
        id: 'p1',
        by: 'zawadi',
        ago: '2 h ago',
        at: 3 * 3600 + 12 * 60 + 12,
        body: 'The way the letter arrives. I rewound twice. Is this where the book turns for everyone?',
        likes: 9,
        replies: 4,
      },
      {
        id: 'p2',
        by: 'daniel',
        ago: '5 h ago',
        body: 'Slower than I expected, in the best way.',
        likes: 3,
        replies: 0,
      },
    ],
  },
];

export const MY_CLUB = 'quiet-pages';

export const getClub = (id: string) => {
  const club = clubs.find(c => c.id === id);
  if (!club) {
    throw new Error(`Unknown club: ${id}`);
  }
  return club;
};
