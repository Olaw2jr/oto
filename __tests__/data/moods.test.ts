import {catalogue} from '../../app/data/catalogue';
import {filterRules} from '../../app/data/moods';

const titlesFor = (filter: string) =>
  catalogue.filter(filterRules[filter]).map(b => b.title);

describe('Discover filters', () => {
  it('keeps non-fiction out of Fiction', () => {
    const fiction = titlesFor('Fiction');
    expect(fiction).toContain('Project Hail Mary');
    expect(fiction).not.toContain('Atomic Habits');
  });
});
