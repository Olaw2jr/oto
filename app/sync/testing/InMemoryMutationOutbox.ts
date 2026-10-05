import type {MutationOutbox} from '../MutationOutbox';
import type {
  MutationFailure,
  NewMutation,
  PendingMutation,
} from '../types';

const copy = (mutation: PendingMutation): PendingMutation => ({
  ...mutation,
  payload: {...mutation.payload},
});

export class InMemoryMutationOutbox implements MutationOutbox {
  private readonly mutations = new Map<string, PendingMutation>();

  async enqueue(mutation: NewMutation | PendingMutation): Promise<void> {
    const current = this.mutations.get(mutation.id);
    this.mutations.set(mutation.id, {
      ...current,
      ...mutation,
      payload: {...mutation.payload},
      attempts: 'attempts' in mutation ? mutation.attempts : current?.attempts ?? 0,
    });
  }

  async get(id: string): Promise<PendingMutation | null> {
    const mutation = this.mutations.get(id);
    return mutation ? copy(mutation) : null;
  }

  async listReady(now: Date): Promise<PendingMutation[]> {
    const nowMs = now.getTime();
    return [...this.mutations.values()]
      .filter(mutation => {
        if (!mutation.retryAt) {
          return true;
        }
        return new Date(mutation.retryAt).getTime() <= nowMs;
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(copy);
  }

  async acknowledge(id: string): Promise<void> {
    this.mutations.delete(id);
  }

  async fail(id: string, failure: MutationFailure): Promise<void> {
    const mutation = this.mutations.get(id);
    if (!mutation) {
      throw new Error(`Unknown mutation: ${id}`);
    }

    this.mutations.set(id, {
      ...mutation,
      attempts: mutation.attempts + 1,
      retryAt: failure.retryAt,
      lastError: failure.error,
    });
  }
}
