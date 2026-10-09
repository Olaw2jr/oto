import {FetchHttpTransport} from '../../app/api';

describe('FetchHttpTransport', () => {
  const respond = (status: number, body: unknown) =>
    jest.fn(async () => ({
      status,
      headers: {forEach: (fn: (v: string, k: string) => void) => fn('application/json', 'content-type')},
      text: async () => JSON.stringify(body),
    }));

  it('sends JSON to the configured base URL and parses JSON back', async () => {
    const fetchImpl = respond(202, {accepted: 2});
    const transport = new FetchHttpTransport('https://api.oto.test/', {fetch: fetchImpl as any});

    const response = await transport.send({
      method: 'POST',
      path: '/v1/telemetry',
      headers: {},
      body: {events: []},
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.oto.test/v1/telemetry',
      expect.objectContaining({
        method: 'POST',
        body: '{"events":[]}',
        headers: expect.objectContaining({'Content-Type': 'application/json', Accept: 'application/json'}),
      }),
    );
    expect(response).toEqual({
      status: 202,
      headers: {'content-type': 'application/json'},
      body: {accepted: 2},
    });
  });

  it('gives up on a request that takes too long', async () => {
    const fetchImpl = jest.fn(
      (_url: string, init: {signal: AbortSignal}) =>
        new Promise((_, reject) =>
          init.signal.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );
    const transport = new FetchHttpTransport('https://api.oto.test', {
      fetch: fetchImpl as any,
      timeoutMs: 10,
    });

    await expect(
      transport.send({method: 'GET', path: '/v1/ping', headers: {}}),
    ).rejects.toThrow('aborted');
  });
});
