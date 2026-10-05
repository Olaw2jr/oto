export type MutationKind =
  | 'library.status'
  | 'progress.update'
  | 'shelf.upsert'
  | 'rating.set'
  | 'social.activity';

export type MutationPayload = Record<string, unknown>;

export type PendingMutation = {
  id: string;
  kind: MutationKind;
  entityId: string;
  payload: MutationPayload;
  createdAt: string;
  attempts: number;
  retryAt?: string;
  lastError?: string;
};

export type NewMutation = Omit<
  PendingMutation,
  'attempts' | 'retryAt' | 'lastError'
>;

export type MutationFailure = {
  retryAt: string;
  error: string;
};
