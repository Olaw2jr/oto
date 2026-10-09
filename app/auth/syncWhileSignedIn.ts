import type {SyncEngine} from '../sync';
import type {AccountSession} from './AccountSession';

// Sends the outbox to oto-api while an account is signed in: at sign-in,
// when the connection comes back and from the background task. Changes made
// while signed out stay queued until someone signs in.
export const syncWhileSignedIn = (
  session: AccountSession,
  engine: Pick<SyncEngine, 'start' | 'flush'>,
): (() => void) => {
  let stopEngine: (() => void) | null = null;
  const update = () => {
    if (session.signedIn() && !stopEngine) {
      stopEngine = engine.start();
      engine.flush().catch(() => {});
    } else if (!session.signedIn() && stopEngine) {
      stopEngine();
      stopEngine = null;
    }
  };
  const unsubscribe = session.subscribe(update);
  update();
  return () => {
    unsubscribe();
    stopEngine?.();
    stopEngine = null;
  };
};
