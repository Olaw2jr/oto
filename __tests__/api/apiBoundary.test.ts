import {
  ApiClient,
  ApiError,
  FakeHttpTransport,
  type HttpResponse,
} from '../../app/api';

describe('API boundary', () => {
  it('sends typed requests through the transport boundary', async () => {
    const transport = new FakeHttpTransport();
    const response: HttpResponse<{title: string}> = {
      status: 200,
      headers: {'content-type': 'application/json'},
      body: {title: 'Book One'},
    };
    transport.enqueue(response);
    const client = new ApiClient(transport);

    await expect(client.get<{title: string}>('/catalogue/book-1')).resolves.toEqual(
      {title: 'Book One'},
    );
    expect(transport.requests).toEqual([
      {
        method: 'GET',
        path: '/catalogue/book-1',
        headers: {},
      },
    ]);
  });

  it('passes request bodies and headers without coupling callers to fetch', async () => {
    const transport = new FakeHttpTransport();
    transport.enqueue({status: 204, headers: {}, body: undefined});
    const client = new ApiClient(transport);

    await client.post('/progress', {bookId: 'book-1', positionSec: 42}, {
      authorization: 'Bearer token',
    });

    expect(transport.requests[0]).toEqual({
      method: 'POST',
      path: '/progress',
      headers: {authorization: 'Bearer token'},
      body: {bookId: 'book-1', positionSec: 42},
    });
  });

  it('throws a typed API error for non-success responses', async () => {
    const transport = new FakeHttpTransport();
    transport.enqueue({
      status: 409,
      headers: {'content-type': 'application/json'},
      body: {code: 'progress_conflict'},
    });
    const client = new ApiClient(transport);

    await expect(client.post('/progress', {positionSec: 10})).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      body: {code: 'progress_conflict'},
    } satisfies Partial<ApiError>);
  });

  it('fails deterministically when a test forgets to queue a response', async () => {
    const transport = new FakeHttpTransport();
    const client = new ApiClient(transport);

    await expect(client.get('/catalogue')).rejects.toThrow(
      'FakeHttpTransport has no queued response',
    );
  });
});
