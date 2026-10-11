import type {SyncEngine} from '../sync';
import type {AccountSession} from './AccountSession';

// New changes are sent this long after the last one, so a burst of edits
// goes in one pass.
const SEND_AFTER_MS = 2_000;

type Recorded = {subscribe(listener: () => void): () => void};

// Sends the outbox to oto-api while an account is signed in: at sign-in,
// shortly after each new change, when the connection comes back and from
// the background task. Changes made while signed out stay queued until
// someone signs in.
export const syncWhileSignedIn = (
  session: AccountSession,
  engine: Pick<SyncEngine, 'start' | 'flush'>,
  recorded?: Recorded,
): (() => void) => {
  let stopEngine: (() => void) | null = null;
  let pending: ReturnType<typeof setTimeout> | null = null;
  const send = () => {
    engine.flush().catch(() => {});
  };
  const update = () => {
    if (session.signedIn() && !stopEngine) {
      stopEngine = engine.start();
      send();
    } else if (!session.signedIn() && stopEngine) {
      stopEngine();
      stopEngine = null;
    }
  };
  const unsubscribe = session.subscribe(update);
  const stopListening = recorded?.subscribe(() => {
    if (!session.signedIn()) return;
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => {
      pending = null;
      send();
    }, SEND_AFTER_MS);
  });
  update();
  return () => {
    unsubscribe();
    stopListening?.();
    if (pending) clearTimeout(pending);
    stopEngine?.();
    stopEngine = null;
  };
};
