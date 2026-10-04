import {catalogue, CatalogueBook} from './catalogue';

const hours = (book: CatalogueBook) => book.durationSec / 3600;
const hasGenre = (book: CatalogueBook, words: string[]) =>
  book.genres.some(g => words.some(w => g.toLowerCase().includes(w)));

export const moodRules: Record<
  string,
  {description: string; matches: (book: CatalogueBook) => boolean}
> = {
  'Quiet evening': {
    description: 'Gentle, literary listens for the end of the day.',
    matches: b =>
      hasGenre(b, [
        'literary',
        'contemporary',
        'grief',
        'relationships',
        'coming of age',
      ]),
  },
  'Long drive': {
    description: 'Twelve hours or more, for the open road.',
    matches: b => hours(b) >= 12,
  },
  Commute: {
    description: 'Seven hours or less, a chapter at a time.',
    matches: b => hours(b) <= 7,
  },
  'Falling asleep': {
    description: 'Steady voices and slow, epic worlds.',
    matches: b => hasGenre(b, ['classics', 'epic', 'philosophy', 'physics']),
  },
};

export const booksForMood = (mood: string) =>
  catalogue.filter(b => moodRules[mood]?.matches(b));

// Discover's filter chips. "For you" shows the usual picks.
export const filterRules: Record<string, (book: CatalogueBook) => boolean> = {
  'Short listens': b => hours(b) < 8,
  Fiction: b =>
    hasGenre(b, [
      'fiction',
      'fantasy',
      'suspense',
      'thriller',
      'contemporary',
      'epic',
      'supernatural',
    ]),
  Memoir: b => hasGenre(b, ['memoir', 'biograph', 'celebrities']),
  Science: b =>
    hasGenre(b, ['physics', 'psychology', 'public health', 'philosophy']),
};
