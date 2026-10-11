import {
  createGoogleIdentity,
  type GoogleSigninModule,
} from '../../app/auth/GoogleIdentity';

function google(result: unknown) {
  const calls: unknown[] = [];
  const module: GoogleSigninModule = {
    configure: options => void calls.push(['configure', options]),
    hasPlayServices: async () => true,
    signIn: async () => result as never,
    signOut: async () => null,
  };
  return {module, calls};
}

describe('Google identity', () => {
  it('is unavailable until a web client id is configured', async () => {
    const identity = createGoogleIdentity(
      {webClientId: null},
      google({}).module,
    );
    expect(identity.available).toBe(false);
    await expect(identity.idToken()).rejects.toThrow(/not configured/);
  });

  it('configures once and returns the ID token', async () => {
    const {module, calls} = google({
      type: 'success',
      data: {idToken: 'id-token'},
    });
    const identity = createGoogleIdentity(
      {webClientId: 'web.apps.googleusercontent.com'},
      module,
    );

    expect(await identity.idToken()).toBe('id-token');
    expect(await identity.idToken()).toBe('id-token');
    expect(calls).toEqual([
      ['configure', {webClientId: 'web.apps.googleusercontent.com'}],
    ]);
  });

  it('returns null when the reader cancels', async () => {
    const identity = createGoogleIdentity(
      {webClientId: 'web'},
      google({type: 'cancelled', data: null}).module,
    );
    expect(await identity.idToken()).toBeNull();
  });
});
