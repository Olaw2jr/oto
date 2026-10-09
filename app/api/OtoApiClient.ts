/** Server-owned catalogue and social state. Native token storage belongs in the
 * platform auth adapter, never AsyncStorage or source-controlled configuration. */
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
export class OtoApiError extends Error {
  constructor(readonly status: number, readonly body: unknown) {
    super('Oto API request failed (' + status + ')');
  }
}
export class OtoApiClient {
  constructor(private readonly baseUrl: string, private readonly tokens: TokenProvider) {
    if (!baseUrl.startsWith('https://') && !baseUrl.startsWith('http://localhost')) {
      throw new Error('Oto API requires HTTPS');
    }
  }
  private async request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    const token = await this.tokens.getAccessToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(init.body ? {'Content-Type': 'application/json'} : {}),
      ...(token ? {'Authorization': 'Bearer ' + token} : {}),
    };
    const response = await fetch(this.baseUrl + path, {...init, headers: {...headers, ...init.headers}});
    if (response.status === 401 && retry && token) {
      const replacement = await this.tokens.refreshAccessToken();
      if (replacement) return this.request<T>(path, init, false);
    }
    if (!response.ok) throw new OtoApiError(response.status, await response.text());
    return response.json() as Promise<T>;
  }
  search(q: string, offset = 0): Promise<Page<OtoBook>> {
    return this.request('/v1/search?q=' + encodeURIComponent(q) + '&offset=' + offset);
  }
  discover(offset = 0): Promise<Page<OtoBook>> {
    return this.request('/v1/discover?offset=' + offset);
  }
  book(id: string): Promise<OtoBook & {editions: unknown[]}> {
    return this.request('/v1/books/' + encodeURIComponent(id));
  }
  library(): Promise<{items: OtoBook[]}> {
    return this.request('/v1/me/library');
  }
  saveBook(id: string): Promise<{saved: boolean}> {
    return this.request('/v1/me/library/' + encodeURIComponent(id), {method: 'PUT'});
  }
  snapshot(): Promise<{library: unknown[]; progress: unknown[]}> {
    return this.request('/v1/sync/snapshot');
  }
}
