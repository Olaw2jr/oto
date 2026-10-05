import type {HttpTransport} from '../HttpTransport';
import type {HttpRequest, HttpResponse} from '../types';

export class FakeHttpTransport implements HttpTransport {
  readonly requests: HttpRequest[] = [];
  private readonly responses: HttpResponse[] = [];

  enqueue(response: HttpResponse): void {
    this.responses.push(response);
  }

  async send<TResponse = unknown, TBody = unknown>(
    request: HttpRequest<TBody>,
  ): Promise<HttpResponse<TResponse>> {
    this.requests.push(request as HttpRequest);
    const response = this.responses.shift();
    if (!response) {
      throw new Error('FakeHttpTransport has no queued response');
    }
    return response as HttpResponse<TResponse>;
  }
}
