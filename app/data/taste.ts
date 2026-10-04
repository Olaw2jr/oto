import {catalogue, CatalogueBook} from './catalogue';

// Genres offered in the taste picker, each matched against catalogue genres.
export const tasteGenres: {label: string; words: string[]}[] = [
  {
    label: 'Literary fiction',
    words: ['literary', 'contemporary', 'coming of age'],
  },
  {label: 'Science fiction', words: ['science fiction', 'space opera']},
  {label: 'Fantasy', words: ['fantasy', 'epic', 'dragons']},
  {label: 'Thrillers', words: ['thriller', 'suspense', 'crime']},
  {label: 'Memoir', words: ['memoir', 'biograph', 'celebrities']},
  {
    label: 'Science',
    words: ['physics', 'psychology', 'public health', 'philosophy'],
  },
  {label: 'Self-improvement', words: ['personal success']},
  {label: 'History', words: ['historical', 'presidents']},
];

const matchesGenre = (book: CatalogueBook, label: string) => {
  const words = tasteGenres.find(g => g.label === label)?.words ?? [];
  return book.genres.some(g => words.some(w => g.toLowerCase().includes(w)));
};

export const picksForTaste = (genres: string[], authors: string[]) =>
  catalogue.filter(
    b =>
      genres.some(g => matchesGenre(b, g)) ||
      authors.some(a => b.author.split(/,\s*/).includes(a)),
  );
