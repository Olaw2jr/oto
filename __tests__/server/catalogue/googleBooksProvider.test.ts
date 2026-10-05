import {GoogleBooksProvider} from '../../../../server/catalogue/providers/googlebooks/GoogleBooksProvider';
import type {JsonHttpClient} from '../../../../server/catalogue/providers';

class StubHttp implements JsonHttpClient {
  calls: string[] = [];
  constructor(private readonly responses: unknown[]) {}
  async getJson<T>(url: string): Promise<T> {
    this.calls.push(url);
    return this.responses.shift() as T;
  }
}

describe('GoogleBooksProvider', () => {
  it('maps volume search results to provider candidates', async () => {
    const http = new StubHttp([{
      items: [{
        id: 'volume-1',
        volumeInfo: {
          title: 'Book One',
          authors: ['Author One'],
          industryIdentifiers: [{type: 'ISBN_13', identifier: '9780000000001'}],
        },
      }],
    }]);
    const provider = new GoogleBooksProvider(http, {apiKey: 'secret'});

    const result = await provider.search({text: 'book one', language: 'en', limit: 7});

    expect(result[0]?.ref).toEqual({providerId: 'googlebooks', externalId: 'volume-1'});
    expect(result[0]?.identifiers.isbn13).toEqual(['9780000000001']);
    expect(http.calls[0]).toContain('maxResults=7');
    expect(http.calls[0]).toContain('langRestrict=en');
    expect(http.calls[0]).toContain('key=secret');
  });

  it('returns enriched volume metadata with provenance', async () => {
    const http = new StubHttp([{
      id: 'volume-1',
      volumeInfo: {
        title: 'Book One',
        subtitle: 'A Subtitle',
        authors: ['Author One'],
        publisher: 'Publisher',
        publishedDate: '2026',
        description: 'Description',
        categories: ['Fiction'],
        language: 'en',
        imageLinks: {thumbnail: 'https://books.example/cover.jpg'},
      },
    }]);
    const provider = new GoogleBooksProvider(http, {now: () => '2026-10-05T00:00:00Z'});

    const record = await provider.get({providerId: 'googlebooks', externalId: 'volume-1'});

    expect(record?.description?.value).toBe('Description');
    expect(record?.publisher?.value).toBe('Publisher');
    expect(record?.title.providerId).toBe('googlebooks');
  });
});
