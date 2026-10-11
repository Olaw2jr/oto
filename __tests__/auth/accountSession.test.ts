import {FakeHttpTransport} from '../../app/api';
import {AccountSession} from '../../app/auth/AccountSession';
import {InMemoryTokenStore} from '../../app/auth/TokenStore';

const tokens = (n: number) => ({
  status: 200,
  headers: {},
  body: {
    access_token: `access-${n}`,
    refresh_token: `refresh-${n}`,
    token_type: 'bearer',
    expires_in: 900,
  },
});

function setup(
  stored: {accessToken: string; refreshToken: string} | null = null,
) {
  const transport = new FakeHttpTransport();
  const store = new InMemoryTokenStore(stored);
  const session = new AccountSession(transport, store);
  return {transport, store, session};
}

describe('AccountSession', () => {
  it('starts signed out, or restores tokens saved on the device', async () => {
    const out = setup();
    await out.session.restore();
    expect(out.session.signedIn()).toBe(false);
    expect(await out.session.getAccessToken()).toBeNull();

    const back = setup({accessToken: 'a', refreshToken: 'r'});
    await back.session.restore();
    expect(back.session.signedIn()).toBe(true);
    expect(await back.session.getAccessToken()).toBe('a');
  });

  it('signs in as a seeded reader and keeps the tokens', async () => {
    const {transport, store, session} = setup();
    transport.enqueue(tokens(1));
    const changes: boolean[] = [];
    session.subscribe(() => changes.push(session.signedIn()));

    await session.signInAsDeveloper('amani');

    expect(transport.requests[0]).toEqual({
      method: 'POST',
      path: '/v1/auth/dev',
      headers: {},
      body: {handle: 'amani'},
    });
    expect(await store.load()).toEqual({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
    expect(changes).toEqual([true]);
  });

  it('signs in with a Google ID token', async () => {
    const {transport, session} = setup();
    transport.enqueue(tokens(1));
    await session.signInWithGoogle('google-id-token-of-enough-length');
    expect(transport.requests[0]).toMatchObject({
      path: '/v1/auth/google',
      body: {id_token: 'google-id-token-of-enough-length'},
    });
    expect(session.signedIn()).toBe(true);
  });

  it('rotates tokens once even when several requests ask at the same time', async () => {
    const {transport, store, session} = setup({
      accessToken: 'a',
      refreshToken: 'r',
    });
    await session.restore();
    transport.enqueue(tokens(2));

    const [first, second] = await Promise.all([
      session.refreshAccessToken(),
      session.refreshAccessToken(),
    ]);

    expect([first, second]).toEqual(['access-2', 'access-2']);
    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0].body).toEqual({refresh_token: 'r'});
    expect((await store.load())?.refreshToken).toBe('refresh-2');
  });

  it('signs out when the refresh session is no longer valid', async () => {
    const {transport, store, session} = setup({
      accessToken: 'a',
      refreshToken: 'r',
    });
    await session.restore();
    transport.enqueue({
      status: 401,
      headers: {},
      body: {error: {code: 'unauthenticated'}},
    });

    expect(await session.refreshAccessToken()).toBeNull();
    expect(session.signedIn()).toBe(false);
    expect(await store.load()).toBeNull();
  });

  it('keeps the session through a temporary refresh failure', async () => {
    const {transport, session} = setup({accessToken: 'a', refreshToken: 'r'});
    await session.restore();
    transport.enqueue({status: 503, headers: {}, body: {}});

    await expect(session.refreshAccessToken()).rejects.toThrow();
    expect(session.signedIn()).toBe(true);
  });

  it('signs out on the server and forgets the tokens', async () => {
    const {transport, store, session} = setup({
      accessToken: 'a',
      refreshToken: 'r',
    });
    await session.restore();
    transport.enqueue({status: 200, headers: {}, body: {revoked: true}});

    await session.signOut();

    expect(transport.requests[0]).toEqual({
      method: 'POST',
      path: '/v1/auth/logout',
      headers: {Authorization: 'Bearer a'},
      body: {refresh_token: 'r'},
    });
    expect(session.signedIn()).toBe(false);
    expect(await store.load()).toBeNull();
  });

  it('signs out locally even when the server cannot be reached', async () => {
    const {transport, session} = setup({accessToken: 'a', refreshToken: 'r'});
    await session.restore();
    transport.enqueue({status: 503, headers: {}, body: {}});
    await session.signOut();
    expect(session.signedIn()).toBe(false);
  });

  it('lists seeded readers, or none when developer sign-in is off', async () => {
    const on = setup();
    on.transport.enqueue({
      status: 200,
      headers: {},
      body: {items: [{handle: 'amani', display_name: 'Amani Wekesa'}]},
    });
    expect(await on.session.developerReaders()).toEqual([
      {handle: 'amani', name: 'Amani Wekesa'},
    ]);

    const off = setup();
    off.transport.enqueue({status: 404, headers: {}, body: {}});
    expect(await off.session.developerReaders()).toEqual([]);
  });
});
