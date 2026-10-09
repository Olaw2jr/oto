import {
  OTO_NAMESPACE,
  bookEntityId,
  editionEntityId,
  isUuid,
  randomUuid,
  uuid5,
} from '../../app/sync/ids';

// Reference values from oto-api's app/ids.py (Python's uuid module).
describe('ids shared with oto-api', () => {
  it('implements RFC 4122 version 5', () => {
    expect(uuid5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'python.org')).toBe(
      '886313e1-3b8a-5372-9b90-0c9aee199e5d',
    );
  });

  it('derives the same ids for bundled books as the server', () => {
    expect(OTO_NAMESPACE).toBe('9c1b0699-73d3-5d39-8514-bb6a597615ad');
    const sample = 'adventures-of-sherlock-holmes-public-domain';
    expect(bookEntityId(sample)).toBe('773c6e75-b331-5613-b6d7-688f28bd456c');
    expect(editionEntityId(sample)).toBe('469bd101-10a7-5c43-a4da-74c6f5a85d3e');
    expect(bookEntityId('greenlights')).toBe('768d0d05-d82b-5deb-84ce-b1885e35a819');
  });

  it('makes random version 4 ids', () => {
    const ids = new Set(Array.from({length: 50}, () => randomUuid()));
    expect(ids.size).toBe(50);
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
    expect(isUuid('road-trips')).toBe(false);
  });
});
