import {LibriVoxProvider} from '../../../server/catalogue/providers/librivox/LibriVoxProvider';
import type {JsonHttpClient} from '../../../server/catalogue/providers';

class StubHttp implements JsonHttpClient {
  calls: Array<{url: string; headers?: Record<string, string>}> = [];
  constructor(private readonly response: unknown) {}
  async getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
    this.calls.push({url, headers});
    return this.response as T;
  }
}

describe('LibriVoxProvider', () => {
  it('maps a public-domain audiobook into an audio rendition', async () => {
    const http = new StubHttp({
      books: [{
        id: '123',
        title: 'Crime and Punishment',
        language: 'English',
        totaltimesecs: '3600',
        authors: [{first_name: 'Fyodor', last_name: 'Dostoevsky'}],
        sections: [
          {id: 's1', title: 'Chapter 1', playtime: '600', readers: [{display_name: 'Reader One'}]},
          {id: 's2', title: 'Chapter 2', playtime: '700', readers: [{display_name: 'Reader Two'}]},
        ],
      }],
    });
    const provider = new LibriVoxProvider(http, {
      userAgent: 'oto-test/1.0',
      now: () => '2026-10-05T00:00:00Z',
    });

    const result = await provider.findRenditions({
      title: 'Crime and Punishment',
      authors: ['Fyodor Dostoevsky'],
      identifiers: {},
    });

    expect(result[0]?.ref).toEqual({providerId: 'librivox', externalId: '123'});
    expect(result[0]?.durationSec).toBe(3600);
    expect(result[0]?.narrators).toEqual(['Reader One', 'Reader Two']);
    expect(result[0]?.chapters[1]?.startSec).toBe(600);
    expect(result[0]?.rights.status).toBe('public-domain');
    expect(http.calls[0]?.headers?.['User-Agent']).toBe('oto-test/1.0');
  });
});
