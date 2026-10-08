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

export const PUBLIC_DOMAIN_SAMPLE_ID = 'adventures-of-sherlock-holmes-public-domain';

export const PUBLIC_DOMAIN_SAMPLE_CHAPTERS = [
  {title: 'A Scandal in Bohemia, Part 1', durationSec: 1670},
  {title: 'A Scandal in Bohemia, Part 2', durationSec: 2350},
  {title: 'The Red-Headed League, Part 1', durationSec: 2182},
  {title: 'The Red-Headed League, Part 2', durationSec: 1930},
  {title: 'A Case of Identity, Part 1', durationSec: 1595},
  {title: 'A Case of Identity, Part 2', durationSec: 1688},
  {title: 'The Boscombe Valley Mystery, Part 1', durationSec: 2435},
  {title: 'The Boscombe Valley Mystery, Part 2', durationSec: 1992},
  {title: 'The Five Orange Pips, Part 1', durationSec: 1864},
  {title: 'The Five Orange Pips, Part 2', durationSec: 1474},
  {title: 'The Man with the Twisted Lip, Part 1', durationSec: 2381},
  {title: 'The Man with the Twisted Lip, Part 2', durationSec: 1977},
  {title: 'The Adventure of the Blue Carbuncle, Part 1', durationSec: 1762},
  {title: 'The Adventure of the Blue Carbuncle, Part 2', durationSec: 2070},
  {title: 'The Adventure of the Speckled Band, Part 1', durationSec: 2163},
  {title: 'The Adventure of the Speckled Band, Part 2', durationSec: 2402},
  {title: "The Adventure of the Engineer's Thumb, Part 1", durationSec: 1879},
  {title: "The Adventure of the Engineer's Thumb, Part 2", durationSec: 1764},
  {title: 'The Adventure of the Noble Bachelor, Part 1', durationSec: 2116},
  {title: 'The Adventure of the Noble Bachelor, Part 2', durationSec: 1853},
  {title: 'The Adventure of the Beryl Coronet, Part 1', durationSec: 2097},
  {title: 'The Adventure of the Beryl Coronet, Part 2', durationSec: 2401},
  {title: 'The Adventure of the Copper Beeches, Part 1', durationSec: 1924},
  {title: 'The Adventure of the Copper Beeches, Part 2', durationSec: 2598},
] as const;

const sourceCatalogue: CatalogueBook[] = books.map(book => {
  const id = slug(book.title);
  const durationSec = parseDuration(book.runtime);
  // Uncurated books get a modest rating so curated ones lead Top rated.
  const [rating, ratingsCount] = ratings[id] ?? [
    Math.min(4.5, Number(book.starRating)),
    120,
  ];
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

const publicDomainSample: CatalogueBook = {
  id: PUBLIC_DOMAIN_SAMPLE_ID,
  title: 'The Adventures of Sherlock Holmes',
  author: 'Arthur Conan Doyle',
  narrator: 'Ruth Golding',
  genre: 'Detective Fiction',
  genres: ['Detective Fiction', 'Short Stories'],
  summary:
    'Twelve Sherlock Holmes stories by Arthur Conan Doyle, presented here as a public-domain LibriVox recording for real playback validation.',
  released: '07-15-10',
  releasedYear: 2010,
  language: 'English',
  cover: {
    uri: 'https://archive.org/services/img/adventures_sherlock_holmes_rg_librivox',
  },
  durationSec: 48567,
  chapters: PUBLIC_DOMAIN_SAMPLE_CHAPTERS.length,
  rating: 4.8,
  ratingsCount: 0,
};

export const catalogue: CatalogueBook[] = [
  ...sourceCatalogue,
  publicDomainSample,
];

export const getBook = (id: string) => {
  const book = catalogue.find(b => b.id === id);
  if (!book) {
    throw new Error(`Unknown book: ${id}`);
  }
  return book;
};

export const chapterAt = (book: CatalogueBook, positionSec: number) => {
  if (book.id === PUBLIC_DOMAIN_SAMPLE_ID) {
    let endSec = 0;
    for (let index = 0; index < PUBLIC_DOMAIN_SAMPLE_CHAPTERS.length; index += 1) {
      endSec += PUBLIC_DOMAIN_SAMPLE_CHAPTERS[index].durationSec;
      if (positionSec < endSec || index === PUBLIC_DOMAIN_SAMPLE_CHAPTERS.length - 1) {
        return index + 1;
      }
    }
  }

  return Math.min(
    book.chapters,
    Math.floor((positionSec / book.durationSec) * book.chapters) + 1,
  );
};
