import {
  LocalhostRangeGateway,
  TorrentStreamTransport,
} from '../../app/transports/torrent';
import {FakeTorrentEngine} from '../../app/transports/torrent/FakeTorrentEngine';

describe('torrent localhost streaming gateway', () => {
  it('exposes the selected torrent file as a loopback HTTP source', async () => {
    const stopped: string[] = [];
    const gateway = new LocalhostRangeGateway({
      start: async input => ({
        routeId: `${input.sessionId}-${input.fileIndex}`,
        port: 43123,
      }),
      stop: async routeId => {
        stopped.push(routeId);
      },
    });
    const engine = new FakeTorrentEngine([
      {index: 0, path: 'book.mp3', sizeBytes: 10_000},
    ]);
    const transport = new TorrentStreamTransport(engine, gateway);
    const source = {
      kind: 'torrent' as const,
      magnetUri: 'magnet:?xt=urn:btih:abc',
      fileIndex: 0,
      trustedSourceId: 'internetarchive',
    };

    const playable = await transport.prepare(source);

    expect(playable.uri).toBe('http://127.0.0.1:43123/media/fake-session-0');
    expect(playable.transport).toBe('torrent');

    await playable.cleanup?.();

    expect(stopped).toEqual(['fake-session-0']);
    expect(engine.closedSessions).toContain('fake-session');
  });

  it('rejects a native bridge that returns an invalid port', async () => {
    const gateway = new LocalhostRangeGateway({
      start: async () => ({routeId: 'bad', port: 0}),
      stop: async () => {},
    });

    await expect(gateway.open('session', 0)).rejects.toThrow('loopback port');
  });
});
