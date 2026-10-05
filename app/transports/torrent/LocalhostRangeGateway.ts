export type RangeRoute = {
  routeId: string;
  url: string;
};

export interface NativeRangeServer {
  start(input: {
    sessionId: string;
    fileIndex: number;
  }): Promise<{routeId: string; port: number}>;
  stop(routeId: string): Promise<void>;
}

export class LocalhostRangeGateway {
  constructor(private readonly native: NativeRangeServer) {}

  async open(sessionId: string, fileIndex: number): Promise<RangeRoute> {
    const route = await this.native.start({sessionId, fileIndex});
    if (!Number.isInteger(route.port) || route.port < 1 || route.port > 65535) {
      throw new Error('Native range server returned an invalid loopback port');
    }
    return {
      routeId: route.routeId,
      url: `http://127.0.0.1:${route.port}/media/${encodeURIComponent(route.routeId)}`,
    };
  }

  close(routeId: string): Promise<void> {
    return this.native.stop(routeId);
  }
}
