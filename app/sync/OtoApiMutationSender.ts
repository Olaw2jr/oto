import {ApiError} from '../api/ApiClient';
import type {OtoApiClient} from '../api/OtoApiClient';
import {MutationRejectedError, type MutationSender} from './SyncEngine';
import type {PendingMutation} from './types';

// Sends one outbox mutation to oto-api. Applied, superseded and duplicate
// results are all done; a rejection, or a mutation the server can't parse,
// will never succeed and is dropped. Anything else is retried.
export class OtoApiMutationSender implements MutationSender {
  constructor(private readonly client: OtoApiClient) {}

  async send(mutation: PendingMutation): Promise<void> {
    let results;
    try {
      ({results} = await this.client.pushMutations([
        {
          id: mutation.id,
          kind: mutation.kind,
          entity_id: mutation.entityId,
          occurred_at: mutation.createdAt,
          payload: mutation.payload,
        },
      ]));
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        throw new MutationRejectedError('invalid_request: the server cannot accept this change');
      }
      throw error;
    }
    const result = results.find(r => r.id === mutation.id);
    if (result?.status === 'rejected') {
      throw new MutationRejectedError(`${result.code}: ${result.message}`);
    }
  }
}
