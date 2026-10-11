import {ApiError} from '../api/ApiClient';
import type {HttpTransport} from '../api/HttpTransport';
import type {TokenProvider} from '../api/OtoApiClient';
import type {StoredTokens, TokenStore} from './TokenStore';

type TokenResponse = {access_token: string; refresh_token: string};

export type DeveloperReader = {handle: string; name: string};

// The signed-in oto-api account: signs in, keeps the tokens in the device's
// secure store, rotates them when the access token expires, and signs out.
// It's the TokenProvider for OtoApiClient.
export class AccountSession implements TokenProvider {
  private tokens: StoredTokens | null = null;
  private refreshing: Promise<string | null> | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly transport: HttpTransport,
    private readonly store: TokenStore,
  ) {}

  async restore(): Promise<void> {
    this.tokens = await this.store.load();
    this.notify();
  }

  signedIn(): boolean {
    return this.tokens !== null;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  private async post<T>(path: string, body: unknown, headers = {}): Promise<T> {
    const response = await this.transport.send<T>({
      method: 'POST',
      path,
      headers,
      body,
    });
    if (response.status < 200 || response.status >= 300) {
      throw new ApiError(response.status, response.body);
    }
    return response.body;
  }

  private async accept(response: TokenResponse): Promise<void> {
    this.tokens = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    };
    await this.store.save(this.tokens);
    this.notify();
  }

  private async forget(): Promise<void> {
    this.tokens = null;
    await this.store.clear();
    this.notify();
  }

  async signInWithGoogle(idToken: string): Promise<void> {
    await this.accept(
      await this.post<TokenResponse>('/v1/auth/google', {id_token: idToken}),
    );
  }

  // Development builds against a seeded backend only (DEV_LOGIN there).
  async signInAsDeveloper(handle: string): Promise<void> {
    await this.accept(await this.post<TokenResponse>('/v1/auth/dev', {handle}));
  }

  async developerReaders(): Promise<DeveloperReader[]> {
    const response = await this.transport.send<{
      items: {handle: string; display_name: string}[];
    }>({method: 'GET', path: '/v1/auth/dev/users', headers: {}});
    if (response.status !== 200) {
      return [];
    }
    return response.body.items.map(r => ({
      handle: r.handle,
      name: r.display_name,
    }));
  }

  async getAccessToken(): Promise<string | null> {
    return this.tokens?.accessToken ?? null;
  }

  // Several requests can find the token expired at once; they share one
  // rotation, because the server accepts each refresh token only once.
  refreshAccessToken(): Promise<string | null> {
    this.refreshing ??= this.rotate().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async rotate(): Promise<string | null> {
    const refreshToken = this.tokens?.refreshToken;
    if (!refreshToken) {
      return null;
    }
    try {
      await this.accept(
        await this.post<TokenResponse>('/v1/auth/refresh', {
          refresh_token: refreshToken,
        }),
      );
      return this.tokens?.accessToken ?? null;
    } catch (error) {
      // Only a refused refresh ends the session; outages are retried later.
      if (error instanceof ApiError && error.status === 401) {
        await this.forget();
        return null;
      }
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const tokens = this.tokens;
    if (tokens) {
      try {
        await this.post(
          '/v1/auth/logout',
          {refresh_token: tokens.refreshToken},
          {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        );
      } catch {
        // Signing out on this device mustn't depend on reaching the server.
      }
    }
    await this.forget();
  }
}
