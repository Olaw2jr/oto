import type {
  MutationFailure,
  NewMutation,
  PendingMutation,
} from './types';

export interface MutationOutbox {
  enqueue(mutation: NewMutation | PendingMutation): Promise<void>;
  get(id: string): Promise<PendingMutation | null>;
  listReady(now: Date): Promise<PendingMutation[]>;
  acknowledge(id: string): Promise<void>;
  fail(id: string, failure: MutationFailure): Promise<void>;
}
