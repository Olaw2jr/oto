import {OpenLibraryProvider} from '../../../server/catalogue/providers/openlibrary/OpenLibraryProvider';
import type {JsonHttpClient} from '../../../server/catalogue/providers';

class StubHttp implements JsonHttpClient {
  calls: Array<{url: string; headers?: Record<string, string>}> = [];
  constructor(private readonly responses: unknown[]) {}
  async getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
    this.calls.push({url, headers});
    return this.responses.shift() as T;
  }
}

describe('OpenLibraryProvider', () => {
  it('maps work search results and identifies the application', async () => {
    const http = new StubHttp([{
      docs: [{
        key: '/works/OL166894W',
        title: 'Crime and Punishment',
        author_name: ['Fyodor Dostoevsky'],
        isbn: ['9780140449136'],
      }],
    }]);
    const provider = new OpenLibraryProvider(http, {
      userAgent: 'oto-test/1.0 (test@example.test)',
      now: () => '2026-10-05T00:00:00Z',
    });

    const result = await provider.search({text: 'crime punishment', limit: 5});

    expect(result[0]?.ref.externalId).toBe('OL166894W');
    expect(result[0]?.identifiers.isbn13).toEqual(['9780140449136']);
    expect(http.calls[0]?.url).toContain('/search.json?q=crime%20punishment');
    expect(http.calls[0]?.headers?.['User-Agent']).toContain('oto-test');
  });

  it('maps an individual work without leaking Open Library response types', async () => {
    const http = new StubHttp([{
      key: '/works/OL166894W',
      title: 'Crime and Punishment',
      description: {value: 'A novel.'},
      subjects: ['Fiction'],
      first_publish_date: '1866',
      covers: [123],
    }]);
    const provider = new OpenLibraryProvider(http, {
      userAgent: 'oto-test/1.0',
      now: () => '2026-10-05T00:00:00Z',
    });

    const record = await provider.get({providerId: 'openlibrary', externalId: 'OL166894W'});

    expect(record?.title.value).toBe('Crime and Punishment');
    expect(record?.description?.value).toBe('A novel.');
    expect(record?.coverUri?.value).toContain('/b/id/123-L.jpg');
  });
});
