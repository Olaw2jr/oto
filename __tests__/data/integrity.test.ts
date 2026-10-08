import {
  catalogue,
  chapterAt,
  getBook,
  PUBLIC_DOMAIN_SAMPLE_ID,
} from '../../app/data/catalogue';
import {clubs} from '../../app/data/clubs';
import {getPerson, people} from '../../app/data/people';
import * as social from '../../app/data/social';

const bookIds = new Set(catalogue.map(b => b.id));

describe('mock data integrity', () => {
  it('gives every catalogue book a unique id, a cover and a length', () => {
    expect(bookIds.size).toBe(catalogue.length);
    for (const book of catalogue) {
      expect(book.cover).toBeTruthy();
      expect(book.durationSec).toBeGreaterThan(0);
    }
  });

  it('only refers to books in the catalogue', () => {
    const referenced = [
      social.CURRENT_BOOK,
      ...Object.keys(social.librarySeed),
      ...social.marginNotes.map(n => n.bookId),
      ...social.reviews.map(r => r.bookId),
      ...Object.keys(social.listeners),
      ...social.trending.map(t => t.bookId),
      social.becauseYouFinished.bookId,
      ...social.becauseYouFinished.picks,
      social.homeFriendActivity.bookId,
      ...clubs.map(c => c.bookId),
      ...social.feedSeed.map(f => f.bookId),
    ];
    expect(referenced.filter(id => !bookIds.has(id))).toEqual([]);
  });

  it('only refers to known people', () => {
    const referenced = [
      ...social.marginNotes.map(n => n.by),
      ...social.reviews.map(r => r.by),
      ...Object.values(social.listeners).flatMap(l => l.people),
      social.homeFriendActivity.by,
      ...clubs.flatMap(c => c.posts.map(p => p.by)),
      ...social.feedSeed.flatMap(f => [f.by, ...f.comments.map(c => c.by)]),
    ];
    expect(() => referenced.forEach(getPerson)).not.toThrow();
    expect(people.length).toBeGreaterThan(0);
  });

  it('works out the chapter from a position', () => {
    const book = getBook('where-the-crawdads-sing');
    expect(chapterAt(book, 0)).toBe(1);
    expect(chapterAt(book, book.durationSec)).toBe(book.chapters);
  });

  it('uses the recorded sample chapter durations at queue boundaries', () => {
    const book = getBook(PUBLIC_DOMAIN_SAMPLE_ID);
    expect(chapterAt(book, 4019)).toBe(2);
    expect(chapterAt(book, 4020)).toBe(3);
  });
});

describe('catalogue text', () => {
  it('turns the source line-break markup into paragraphs', () => {
    const {cleanSummary} = require('../../app/data/catalogue');
    expect(
      cleanSummary('One.{\\r\\n\\r\\n}Two.(\\r\\n)Three.\r\n\r\nFour.'),
    ).toBe('One.\n\nTwo.\n\nThree.\n\nFour.');
  });

  it('has no markup left in any synopsis', () => {
    for (const book of catalogue) {
      expect(book.summary).not.toMatch(/\\r|\\n|[{}]|\r/);
    }
  });

  it('puts Where the Crawdads Sing at chapter 14 for the club', () => {
    const book = getBook('where-the-crawdads-sing');
    expect(chapterAt(book, book.durationSec * 0.28)).toBe(14);
  });
});

describe('book facts', () => {
  it('reads the release year, language and genres', () => {
    const book = getBook('where-the-crawdads-sing');
    expect(book.releasedYear).toBeGreaterThan(1900);
    expect(book.language).toBe('English');
    expect(book.genres.length).toBeGreaterThan(0);
    expect(book.genres.every(g => g === g.trim() && g.length > 0)).toBe(true);
  });

  it('gives every book a four-digit year and a language', () => {
    for (const book of catalogue) {
      expect(String(book.releasedYear)).toMatch(/^(19|20)\d\d$/);
      expect(book.language).toBe('English');
    }
  });
});

describe('feed comments', () => {
  it('only nests replies under top-level comments of the same post', () => {
    for (const item of social.feedSeed) {
      const ids = new Set(
        item.comments.filter(c => !c.parentId).map(c => c.id),
      );
      for (const c of item.comments.filter(x => x.parentId)) {
        expect(ids.has(c.parentId!)).toBe(true);
      }
    }
  });
});
