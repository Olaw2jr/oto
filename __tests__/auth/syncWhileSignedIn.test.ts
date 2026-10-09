import {FakeHttpTransport} from '../../app/api';
import {AccountSession, InMemoryTokenStore} from '../../app/auth';
import {syncWhileSignedIn} from '../../app/auth/syncWhileSignedIn';
import type {SyncEngine} from '../../app/sync';

function engine() {
  const calls: string[] = [];
  const fake = {
    start: () => {
      calls.push('start');
      return () => calls.push('stop');
    },
    flush: async () => {
      calls.push('flush');
      return {sent: 0, rejected: 0, pending: 0};
    },
  } as unknown as SyncEngine;
  return {fake, calls};
}

const tokens = {
  status: 200,
  headers: {},
  body: {access_token: 'a', refresh_token: 'r'},
};

describe('syncWhileSignedIn', () => {
  it('sends queued changes only while an account is signed in', async () => {
    const transport = new FakeHttpTransport();
    const session = new AccountSession(transport, new InMemoryTokenStore());
    const {fake, calls} = engine();

    const stop = syncWhileSignedIn(session, fake);
    expect(calls).toEqual([]);

    transport.enqueue(tokens);
    await session.signInAsDeveloper('amani');
    expect(calls).toEqual(['start', 'flush']);

    transport.enqueue({status: 200, headers: {}, body: {}});
    await session.signOut();
    expect(calls).toEqual(['start', 'flush', 'stop']);

    stop();
    transport.enqueue(tokens);
    await session.signInAsDeveloper('amani');
    expect(calls).toHaveLength(3);
  });

  it('starts at once for an account restored from the device', async () => {
    const session = new AccountSession(
      new FakeHttpTransport(),
      new InMemoryTokenStore({accessToken: 'a', refreshToken: 'r'}),
    );
    await session.restore();
    const {fake, calls} = engine();

    syncWhileSignedIn(session, fake);
    expect(calls).toEqual(['start', 'flush']);
  });
});
