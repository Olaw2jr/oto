import {ApiError} from './ApiClient';
import {FetchHttpTransport} from './FetchHttpTransport';
import type {HttpTransport} from './HttpTransport';
import type {HttpHeaders, HttpMethod} from './types';

// Typed client for oto-api (github.com/Olaw2jr/oto-api). Tokens come from
// the platform auth adapter, never AsyncStorage or source control.

export type OtoBook = {
  id: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  language: string | null;
};

export type Page<T> = {items: T[]; limit: number; offset: number};

export interface TokenProvider {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
}

export type SyncMutation = {
  id: string;
  kind: string;
  entity_id: string;
  occurred_at: string;
  payload: Record<string, unknown>;
};

export type SyncMutationResult =
  | {id: string; status: 'applied' | 'superseded' | 'duplicate'}
  | {id: string; status: 'rejected'; code: string; message: string};

export class OtoApiClient {
  constructor(
    private readonly transport: HttpTransport,
    private readonly tokens: TokenProvider,
  ) {}

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    retry = true,
  ): Promise<T> {
    const token = await this.tokens.getAccessToken();
    const headers: HttpHeaders = token ? {Authorization: `Bearer ${token}`} : {};
    const response = await this.transport.send<T>(
      body === undefined ? {method, path, headers} : {method, path, headers, body},
    );
    // An expired token gets one refresh and one retry.
    if (response.status === 401 && retry && token) {
      if (await this.tokens.refreshAccessToken()) {
        return this.request<T>(method, path, body, false);
      }
    }
    if (response.status < 200 || response.status >= 300) {
      throw new ApiError(response.status, response.body);
    }
    return response.body;
  }

  search(q: string, offset = 0): Promise<Page<OtoBook>> {
    return this.request('GET', `/v1/search?q=${encodeURIComponent(q)}&offset=${offset}`);
  }

  discover(offset = 0): Promise<Page<OtoBook>> {
    return this.request('GET', `/v1/discover?offset=${offset}`);
  }

  book(id: string): Promise<OtoBook & {editions: unknown[]}> {
    return this.request('GET', `/v1/books/${encodeURIComponent(id)}`);
  }

  library(): Promise<{items: OtoBook[]}> {
    return this.request('GET', '/v1/me/library');
  }

  saveBook(id: string): Promise<{saved: boolean}> {
    return this.request('PUT', `/v1/me/library/${encodeURIComponent(id)}`);
  }

  snapshot(): Promise<{library: unknown[]; progress: unknown[]}> {
    return this.request('GET', '/v1/sync/snapshot');
  }

  pushMutations(
    mutations: SyncMutation[],
  ): Promise<{results: SyncMutationResult[]}> {
    return this.request('POST', '/v1/sync/mutations', {mutations});
  }
}

const LOCAL_DEVELOPMENT = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/;

// Builds the client for apiBaseUrl. Only HTTPS is allowed, apart from a
// backend running on the developer's machine.
export function createOtoApiClient(
  baseUrl: string,
  tokens: TokenProvider,
): OtoApiClient {
  if (!baseUrl.startsWith('https://') && !LOCAL_DEVELOPMENT.test(baseUrl)) {
    throw new Error('oto-api must be reached over HTTPS');
  }
  return new OtoApiClient(new FetchHttpTransport(baseUrl), tokens);
}
