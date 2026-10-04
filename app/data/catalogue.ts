import {ImageSourcePropType} from 'react-native';

import {books} from './sourceBooks';
import {parseDuration} from './format';

export type CatalogueBook = {
  id: string;
  title: string;
  author: string;
  narrator: string;
  series?: string;
  genre: string;
  genres: string[];
  summary: string;
  released: string;
  releasedYear: number;
  language: string;
  cover: ImageSourcePropType;
  durationSec: number;
  chapters: number;
  rating: number;
  ratingsCount: number;
};

// Source dates are MM-DD-YY.
const yearOf = (date: string) => 2000 + Number(date.split('-')[2] ?? 0);

// The source stores the language code in its `rating` field.
const languages: Record<string, string> = {EN: 'English', English: 'English'};

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Ratings shown on oto (the source data only has a 1–5 star field).
const ratings: Record<string, [number, number]> = {
  'where-the-crawdads-sing': [4.4, 2184],
  'tuesdays-with-morrie': [4.6, 1312],
  'starry-messenger': [4.2, 640],
  'the-lost-book-of-eleanor-dare': [4.1, 288],
  'project-hail-mary': [4.8, 5120],
  'the-silmarillion': [4.3, 1904],
  'fire-blood-hbo-tie-in-edition': [4.5, 2410],
  greenlights: [4.6, 3302],
  'atomic-habits': [4.7, 6011],
  'it-ends-with-us': [4.4, 4120],
};

// The source synopses mark paragraphs with literal "\\r\\n" runs, sometimes
// wrapped in {} or ().
export const cleanSummary = (text: string) =>
  text
    .replace(/[{(]?(?:\\r\\n|\r\n)+[})]?/g, '\n\n')
    // Braces also wrap single characters, e.g. {—} or {’}.
    .replace(/[{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// Chapter counts where the story needs a specific chapter (the club is on
// chapter 14 of Where the Crawdads Sing at 28%).
const chapterCounts: Record<string, number> = {'where-the-crawdads-sing': 48};

export const catalogue: CatalogueBook[] = books.map(book => {
  const id = slug(book.title);
  const durationSec = parseDuration(book.runtime);
  const [rating, ratingsCount] = ratings[id] ?? [Number(book.starRating), 120];
  return {
    id,
    title: book.title.replace(/^P(?=The )/, ''),
    author: book.cast,
    narrator: book.narrator,
    series: book.series,
    genre: book.genre,
    genres: book.genre
      .split(',')
      .map(g => g.trim())
      .filter(Boolean),
    summary: cleanSummary(book.summary),
    released: book.year,
    releasedYear: yearOf(book.year),
    language: languages[book.rating] ?? book.rating,
    cover: book.image,
    durationSec,
    // About one chapter per 25 minutes of audio.
    chapters: chapterCounts[id] ?? Math.max(1, Math.round(durationSec / 1500)),
    rating,
    ratingsCount,
  };
});

export const getBook = (id: string) => {
  const book = catalogue.find(b => b.id === id);
  if (!book) {
    throw new Error(`Unknown book: ${id}`);
  }
  return book;
};

export const chapterAt = (book: CatalogueBook, positionSec: number) =>
  Math.min(
    book.chapters,
    Math.floor((positionSec / book.durationSec) * book.chapters) + 1,
  );
