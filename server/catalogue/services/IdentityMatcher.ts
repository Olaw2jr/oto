import type {BookIdentifiers} from '../../../app/domain';
import type {CanonicalBookHint, ProviderBookCandidate} from '../providers';

type Identity = {
  title: string;
  authors: string[];
  identifiers: BookIdentifiers;
};

const normalize = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const identifierValues = (identifiers: BookIdentifiers): string[] => [
  ...(identifiers.isbn10 ?? []),
  ...(identifiers.isbn13 ?? []),
  identifiers.openLibraryWorkId,
  identifiers.googleBooksVolumeId,
  identifiers.gutenbergId,
].filter((value): value is string => Boolean(value));

const identifierMatch = (left: BookIdentifiers, right: BookIdentifiers): boolean => {
  const rightValues = new Set(identifierValues(right));
  return identifierValues(left).some(value => rightValues.has(value));
};

const authorOverlap = (left: string[], right: string[]): boolean => {
  const normalized = new Set(left.map(normalize));
  return right.map(normalize).some(author => normalized.has(author));
};

export class IdentityMatcher {
  score(left: Identity | CanonicalBookHint, right: Identity | ProviderBookCandidate): number {
    if (identifierMatch(left.identifiers, right.identifiers)) {
      return 1;
    }

    const sameTitle = normalize(left.title) === normalize(right.title);
    const sameAuthor = authorOverlap(left.authors, right.authors);

    if (sameTitle && sameAuthor) {
      return 0.9;
    }
    if (sameTitle) {
      return 0.65;
    }
    if (sameAuthor) {
      return 0.35;
    }
    return 0;
  }

  bestMatch<T extends ProviderBookCandidate>(
    identity: Identity | CanonicalBookHint,
    candidates: T[],
    minimumScore = 0.8,
  ): T | null {
    const ranked = candidates
      .map(candidate => ({candidate, score: this.score(identity, candidate)}))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    return best && best.score >= minimumScore ? best.candidate : null;
  }
}

export {normalize as normalizeBookIdentity};
