import {catalogue, chapterAt, getBook} from '../../app/data/catalogue';
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
    ];
    expect(() => referenced.forEach(getPerson)).not.toThrow();
    expect(people.length).toBeGreaterThan(0);
  });

  it('works out the chapter from a position', () => {
    const book = getBook('where-the-crawdads-sing');
    expect(chapterAt(book, 0)).toBe(1);
    expect(chapterAt(book, book.durationSec)).toBe(book.chapters);
  });
});
