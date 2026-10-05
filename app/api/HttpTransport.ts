import type {HttpRequest, HttpResponse} from './types';

export interface HttpTransport {
  send<TResponse = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
  ): Promise<HttpResponse<TResponse>>;
}
