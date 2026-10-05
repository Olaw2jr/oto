export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpHeaders = Record<string, string>;

export type HttpRequest<TBody = unknown> = {
  method: HttpMethod;
  path: string;
  headers: HttpHeaders;
  body?: TBody;
};

export type HttpResponse<TBody = unknown> = {
  status: number;
  headers: HttpHeaders;
  body: TBody;
};
