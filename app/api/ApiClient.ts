import type {HttpTransport} from './HttpTransport';
import type {HttpHeaders, HttpRequest} from './types';

export class ApiError extends Error {
  readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`API request failed with status ${status}`);
  }
}

export class ApiClient {
  constructor(private readonly transport: HttpTransport) {}

  private async request<TResponse, TBody = unknown>(
    request: HttpRequest<TBody>,
  ): Promise<TResponse> {
    const response = await this.transport.send<TResponse, TBody>(request);
    if (response.status < 200 || response.status >= 300) {
      throw new ApiError(response.status, response.body);
    }
    return response.body;
  }

  get<TResponse>(
    path: string,
    headers: HttpHeaders = {},
  ): Promise<TResponse> {
    return this.request<TResponse>({
      method: 'GET',
      path,
      headers,
    });
  }

  post<TResponse = unknown, TBody = unknown>(
    path: string,
    body: TBody,
    headers: HttpHeaders = {},
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>({
      method: 'POST',
      path,
      headers,
      body,
    });
  }
}
