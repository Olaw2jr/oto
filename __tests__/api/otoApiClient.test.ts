import {
  ApiError,
  FakeHttpTransport,
  OtoApiClient,
  createOtoApiClient,
} from '../../app/api';
import type {TokenProvider} from '../../app/api';

const ok = (body: unknown) => ({status: 200, headers: {}, body});
const unauthorized = {status: 401, headers: {}, body: {detail: 'expired'}};

function tokens(initial: string | null, refreshed: string | null = null) {
  let current = initial;
  const provider: TokenProvider & {refreshes: number} = {
    refreshes: 0,
    getAccessToken: async () => current,
    refreshAccessToken: async () => {
      provider.refreshes += 1;
      current = refreshed;
      return refreshed;
    },
  };
  return provider;
}

describe('OtoApiClient', () => {
  it('sends the access token as a bearer header', async () => {
    const transport = new FakeHttpTransport();
    transport.enqueue(ok({items: [], limit: 20, offset: 0}));
    const client = new OtoApiClient(transport, tokens('abc'));

    await client.discover();

    expect(transport.requests[0]).toEqual({
      method: 'GET',
      path: '/v1/discover?offset=0',
      headers: {Authorization: 'Bearer abc'},
    });
  });

  it('sends no Authorization header when signed out', async () => {
    const transport = new FakeHttpTransport();
    transport.enqueue(ok({items: [], limit: 20, offset: 0}));

    await new OtoApiClient(transport, tokens(null)).search('dune & co', 20);

    expect(transport.requests[0].path).toBe('/v1/search?q=dune%20%26%20co&offset=20');
    expect(transport.requests[0].headers).toEqual({});
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    const transport = new FakeHttpTransport();
    transport.enqueue(unauthorized);
    transport.enqueue(ok({items: []}));
    const provider = tokens('old', 'new');

    await expect(new OtoApiClient(transport, provider).library()).resolves.toEqual({items: []});

    expect(provider.refreshes).toBe(1);
    expect(transport.requests.map(r => r.headers.Authorization)).toEqual([
      'Bearer old',
      'Bearer new',
    ]);
  });

  it('gives up after one retry, or when the refresh fails', async () => {
    const repeated = new FakeHttpTransport();
    repeated.enqueue(unauthorized);
    repeated.enqueue(unauthorized);
    await expect(
      new OtoApiClient(repeated, tokens('old', 'new')).library(),
    ).rejects.toMatchObject({status: 401});
    expect(repeated.requests).toHaveLength(2);

    const noRefresh = new FakeHttpTransport();
    noRefresh.enqueue(unauthorized);
    await expect(
      new OtoApiClient(noRefresh, tokens('old', null)).library(),
    ).rejects.toBeInstanceOf(ApiError);
    expect(noRefresh.requests).toHaveLength(1);
  });

  it('saves a book with PUT and an encoded id', async () => {
    const transport = new FakeHttpTransport();
    transport.enqueue(ok({saved: true}));

    await new OtoApiClient(transport, tokens('t')).saveBook('a/b');

    expect(transport.requests[0]).toMatchObject({
      method: 'PUT',
      path: '/v1/me/library/a%2Fb',
    });
  });
});

describe('createOtoApiClient', () => {
  it('requires HTTPS except for local development', () => {
    expect(() => createOtoApiClient('http://api.oto.tz', tokens(null))).toThrow(/HTTPS/);
    expect(() => createOtoApiClient('http://localhost.evil.com', tokens(null))).toThrow(/HTTPS/);
    expect(createOtoApiClient('https://api.oto.tz', tokens(null))).toBeInstanceOf(OtoApiClient);
    expect(createOtoApiClient('http://localhost:8000', tokens(null))).toBeInstanceOf(OtoApiClient);
    expect(createOtoApiClient('http://127.0.0.1:8000', tokens(null))).toBeInstanceOf(OtoApiClient);
  });
});
