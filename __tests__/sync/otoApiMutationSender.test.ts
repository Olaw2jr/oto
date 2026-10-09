import {ApiError, FakeHttpTransport, OtoApiClient} from '../../app/api';
import {MutationRejectedError} from '../../app/sync';
import {OtoApiMutationSender} from '../../app/sync/OtoApiMutationSender';
import type {PendingMutation} from '../../app/sync';

const mutation: PendingMutation = {
  id: '00000000-0000-4000-8000-000000000001',
  kind: 'library.status',
  entityId: '768d0d05-d82b-5deb-84ce-b1885e35a819',
  payload: {status: 'want'},
  createdAt: '2026-10-01T12:00:00.000Z',
  attempts: 0,
};

function setup(...responses: Array<{status: number; body: unknown}>) {
  const transport = new FakeHttpTransport();
  responses.forEach(r => transport.enqueue({...r, headers: {}}));
  const tokens = {getAccessToken: async () => 't', refreshAccessToken: async () => null};
  return {transport, sender: new OtoApiMutationSender(new OtoApiClient(transport, tokens))};
}

const result = (status: string, extra = {}) => ({
  status: 200,
  body: {results: [{id: mutation.id, status, ...extra}]},
});

describe('OtoApiMutationSender', () => {
  it('posts the mutation in the protocol shape', async () => {
    const {transport, sender} = setup(result('applied'));
    await sender.send(mutation);

    expect(transport.requests[0]).toEqual({
      method: 'POST',
      path: '/v1/sync/mutations',
      headers: {Authorization: 'Bearer t'},
      body: {mutations: [{
        id: mutation.id,
        kind: 'library.status',
        entity_id: mutation.entityId,
        occurred_at: mutation.createdAt,
        payload: {status: 'want'},
      }]},
    });
  });

  it.each(['applied', 'superseded', 'duplicate'])('treats %s as done', async status => {
    const {sender} = setup(result(status));
    await expect(sender.send(mutation)).resolves.toBeUndefined();
  });

  it('turns a rejection into a permanent failure', async () => {
    const {sender} = setup(result('rejected', {code: 'unknown_book', message: 'Not here'}));
    await expect(sender.send(mutation)).rejects.toEqual(
      new MutationRejectedError('unknown_book: Not here'),
    );
  });

  it('drops a mutation the server can never accept', async () => {
    const {sender} = setup({status: 422, body: {error: {code: 'invalid_request'}}});
    await expect(sender.send(mutation)).rejects.toBeInstanceOf(MutationRejectedError);
  });

  it('leaves server faults to be retried', async () => {
    const {sender} = setup({status: 503, body: {}});
    const failure = sender.send(mutation);
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.not.toBeInstanceOf(MutationRejectedError);
  });
});
