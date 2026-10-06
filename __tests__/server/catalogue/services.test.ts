import {IdentityMatcher} from '../../../server/catalogue/services/IdentityMatcher';
import {MetadataMerger} from '../../../server/catalogue/services/MetadataMerger';
import type {ProviderBookRecord} from '../../../server/catalogue/providers';

const at = '2026-10-05T00:00:00Z';

const record = (
  providerId: string,
  externalId: string,
  title: string,
  authors: string[],
  identifiers: ProviderBookRecord['identifiers'],
): ProviderBookRecord => ({
  ref: {providerId, externalId},
  title: {value: title, providerId, externalId, fetchedAt: at},
  authors: {value: authors, providerId, externalId, fetchedAt: at},
  subjects: {value: [], providerId, externalId, fetchedAt: at},
  identifiers,
});

describe('canonical catalogue services', () => {
  it('matches identifiers before fuzzy title and author identity', () => {
    const matcher = new IdentityMatcher();
    const canonical = {title: 'The Left Hand of Darkness', authors: ['Ursula K. Le Guin'], identifiers: {isbn13: ['9780441478125']}};

    expect(matcher.score(canonical, {title: 'Different label', authors: ['Someone'], identifiers: {isbn13: ['9780441478125']}})).toBe(1);
    expect(matcher.score(canonical, {title: 'The Left Hand of Darkness', authors: ['Ursula K Le Guin'], identifiers: {}})).toBeGreaterThanOrEqual(0.8);
  });

  it('merges records using source priority while retaining provenance', () => {
    const openLibrary = record('openlibrary', 'OL1W', 'Book One', ['Author'], {openLibraryWorkId: 'OL1W'});
    openLibrary.description = {value: 'Open description', providerId: 'openlibrary', fetchedAt: at};

    const google = record('googlebooks', 'g1', 'Book One', ['Author'], {googleBooksVolumeId: 'g1'});
    google.description = {value: 'Google description', providerId: 'googlebooks', fetchedAt: at};
    google.subjects = {value: ['Fiction'], providerId: 'googlebooks', fetchedAt: at};

    const merged = new MetadataMerger(['openlibrary', 'googlebooks']).merge([google, openLibrary]);

    expect(merged.work.description).toBe('Open description');
    expect(merged.work.subjects).toEqual(['Fiction']);
    expect(merged.provenance.description?.providerId).toBe('openlibrary');
    expect(merged.work.identifiers.googleBooksVolumeId).toBe('g1');
  });
});
