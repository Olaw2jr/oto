import type {GoogleSignin} from '@react-native-google-signin/google-signin';

export type GoogleSigninModule = Pick<
  typeof GoogleSignin,
  'configure' | 'hasPlayServices' | 'signIn' | 'signOut'
>;

export type GoogleConfig = {
  // The OAuth web client id; its ID tokens are what oto-api verifies.
  webClientId: string | null;
  iosClientId?: string | null;
};

export type GoogleIdentity = {
  available: boolean;
  // A Google ID token for oto-api, or null if the reader cancelled.
  idToken(): Promise<string | null>;
};

// Native Google sign-in. It stays unavailable, and the button keeps its
// local behaviour, until the client ids are set in app/config/environment.ts.
export const createGoogleIdentity = (
  config: GoogleConfig,
  google: GoogleSigninModule,
): GoogleIdentity => {
  let configured = false;
  return {
    available: Boolean(config.webClientId),
    async idToken() {
      if (!config.webClientId) {
        throw new Error('Google sign-in is not configured');
      }
      if (!configured) {
        google.configure({
          webClientId: config.webClientId,
          ...(config.iosClientId ? {iosClientId: config.iosClientId} : {}),
        });
        configured = true;
      }
      await google.hasPlayServices({showPlayServicesUpdateDialog: true});
      const response = await google.signIn();
      if (response.type !== 'success') {
        return null;
      }
      return response.data.idToken ?? null;
    },
  };
};
