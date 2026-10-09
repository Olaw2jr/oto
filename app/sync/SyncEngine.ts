import type {BackgroundScheduler} from '../background';
import type {Connectivity} from '../connectivity';
import type {MutationOutbox} from './MutationOutbox';
import type {PendingMutation} from './types';

// Sends one change to the server. The mutation id is the idempotency key:
// a retry sends the same id, so the server can apply it at most once.
// Throw MutationRejectedError when the server refuses the change for good;
// anything else is treated as temporary and retried.
export interface MutationSender {
  send(mutation: PendingMutation): Promise<void>;
}

export class MutationRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MutationRejectedError';
  }
}

export type FlushResult = {sent: number; rejected: number; pending: number};

const BASE_DELAY_MS = 2_000;
const MAX_DELAY_MS = 15 * 60_000;
// Every pending mutation is ready by this date.
const END_OF_TIME = new Date(8_640_000_000_000_000);

// Exponential backoff with full jitter: a random wait up to 2 s, 4 s, 8 s …
// capped at 15 minutes, so reconnecting devices don't retry in lockstep.
export const retryDelayMs = (attempt: number, random: () => number) =>
  Math.round(
    random() *
      Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1)),
  );

export type SyncEngineOptions = {
  outbox: MutationOutbox;
  sender: MutationSender;
  connectivity: Connectivity;
  scheduler?: BackgroundScheduler;
  now?: () => Date;
  random?: () => number;
  // A change the server refused is dropped; this is where to log or show it.
  onRejected?: (mutation: PendingMutation, reason: string) => void;
};

// Drains the outbox in order whenever oto is online: on demand, when the
// connection comes back, and from the background sync task.
export class SyncEngine {
  private running: Promise<FlushResult> | null = null;

  constructor(private readonly options: SyncEngineOptions) {}

  flush(): Promise<FlushResult> {
    this.running ??= this.drain().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  // Resolves once any flush in progress has finished.
  async idle(): Promise<void> {
    await this.running?.catch(() => {});
  }

  start(): () => void {
    const {connectivity, scheduler} = this.options;
    let online = connectivity.current().online;
    const stopListening = connectivity.subscribe(state => {
      const reconnected = state.online && !online;
      online = state.online;
      if (reconnected) {
        this.flush().catch(() => {});
      }
    });
    const unregister = scheduler?.register('sync.flush', async () => {
      await this.flush();
    });
    return () => {
      stopListening();
      unregister?.();
    };
  }

  private async drain(): Promise<FlushResult> {
    const {outbox, sender, connectivity, scheduler, onRejected} = this.options;
    const now = this.options.now ?? (() => new Date());
    const random = this.options.random ?? Math.random;
    let sent = 0;
    let rejected = 0;

    if (connectivity.current().online) {
      for (const mutation of await outbox.listReady(now())) {
        try {
          await sender.send(mutation);
          await outbox.acknowledge(mutation.id);
          sent += 1;
        } catch (error) {
          if (error instanceof MutationRejectedError) {
            await outbox.acknowledge(mutation.id);
            rejected += 1;
            onRejected?.(mutation, error.message);
            continue;
          }
          // Stop here so later changes to the same book keep their order.
          const retryAt = new Date(
            now().getTime() + retryDelayMs(mutation.attempts + 1, random),
          ).toISOString();
          await outbox.fail(mutation.id, {
            retryAt,
            error: error instanceof Error ? error.message : String(error),
          });
          await scheduler?.schedule('sync.flush', {
            earliestStartAt: retryAt,
            requiresNetwork: true,
          });
          break;
        }
      }
    }

    const pending = (await outbox.listReady(END_OF_TIME)).length;
    return {sent, rejected, pending};
  }
}
