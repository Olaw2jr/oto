// Where the oto-api tokens live between launches. Production uses the
// Keychain (iOS) or the Keystore-backed store (Android); never AsyncStorage.

export type StoredTokens = {accessToken: string; refreshToken: string};

export interface TokenStore {
  load(): Promise<StoredTokens | null>;
  save(tokens: StoredTokens): Promise<void>;
  clear(): Promise<void>;
}

export class InMemoryTokenStore implements TokenStore {
  constructor(private tokens: StoredTokens | null = null) {}

  async load() {
    return this.tokens;
  }

  async save(tokens: StoredTokens) {
    this.tokens = tokens;
  }

  async clear() {
    this.tokens = null;
  }
}
