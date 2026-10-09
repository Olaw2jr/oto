import type {HttpTransport} from './HttpTransport';
import type {HttpHeaders, HttpRequest, HttpResponse} from './types';

type FetchLike = (
  url: string,
  init: {method: string; headers: HttpHeaders; body?: string; signal: AbortSignal},
) => Promise<{
  status: number;
  headers: {forEach(fn: (value: string, key: string) => void): void};
  text(): Promise<string>;
}>;

// JSON over fetch to the oto backend, with a per-request timeout.
export class FetchHttpTransport implements HttpTransport {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(
    baseUrl: string,
    options: {fetch?: FetchLike; timeoutMs?: number} = {},
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fetchImpl = options.fetch ?? (fetch as unknown as FetchLike);
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async send<TResponse = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
  ): Promise<HttpResponse<TResponse>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${request.path}`, {
        method: request.method,
        headers: {
          Accept: 'application/json',
          ...(request.body === undefined ? {} : {'Content-Type': 'application/json'}),
          ...request.headers,
        },
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: controller.signal,
      });
      const headers: HttpHeaders = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
      const text = await response.text();
      return {
        status: response.status,
        headers,
        body: (text ? JSON.parse(text) : null) as TResponse,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
