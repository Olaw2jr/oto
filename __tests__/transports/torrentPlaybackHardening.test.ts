import {
  FakeTorrentEngine,
  InMemoryTorrentResumeStore,
  LocalhostRangeGateway,
  TorrentDownloadManager,
  TorrentPiecePlanner,
  TorrentSessionPool,
  TorrentStreamTransport,
} from '../../app/transports/torrent';

describe('torrent playback hardening', () => {
  const source = {
    kind: 'torrent' as const,
    magnetUri: 'magnet:?xt=urn:btih:abc',
    fileIndex: 0,
    trustedSourceId: 'internetarchive',
  };

  it('plans bounded byte windows around playback position', () => {
    const planner = new TorrentPiecePlanner();
    expect(planner.plan({
      fileSizeBytes: 10_000,
      durationSec: 100,
      positionSec: 50,
      lookBehindSec: 5,
      bufferAheadSec: 30,
    })).toEqual({startByte: 4500, endByte: 7999});
  });

  it('shares one torrent session between download and streaming consumers', async () => {
    const engine = new FakeTorrentEngine([{index: 0, path: 'book.mp3', sizeBytes: 10_000}]);
    const pool = new TorrentSessionPool(engine);
    const downloads = new TorrentDownloadManager(pool, new InMemoryTorrentResumeStore());
    const gateway = new LocalhostRangeGateway({
      start: async () => ({routeId: 'route-1', port: 43123}),
      stop: async () => {},
    });
    const streaming = new TorrentStreamTransport(pool, gateway);

    await downloads.start('asset-1', source);
    const playable = await streaming.prepare(source, {
      durationSec: 100,
      positionSec: 10,
      bufferAheadSec: 20,
      lookBehindSec: 5,
    });

    expect(engine.openCount).toBe(1);
    expect(engine.rangePriorities.at(-1)).toMatchObject({
      startByte: 500,
      endByte: 2999,
    });

    await playable.cleanup?.();
    expect(engine.closedSessions).toEqual([]);

    await downloads.pause('asset-1');
    expect(engine.closedSessions).toEqual(['fake-session']);
  });

  it('moves priority on seek and recovers a loopback route without reopening the torrent', async () => {
    const engine = new FakeTorrentEngine([{index: 0, path: 'book.mp3', sizeBytes: 10_000}]);
    const pool = new TorrentSessionPool(engine);
    let startCount = 0;
    const stopped: string[] = [];
    const gateway = new LocalhostRangeGateway({
      start: async () => {
        startCount += 1;
        return {routeId: `route-${startCount}`, port: 43122 + startCount};
      },
      stop: async routeId => {
        stopped.push(routeId);
      },
    });
    const streaming = new TorrentStreamTransport(pool, gateway);
    const playable = await streaming.prepare(source, {
      durationSec: 100,
      positionSec: 10,
      bufferAheadSec: 20,
      lookBehindSec: 5,
    });

    await playable.control?.seek(50);
    expect(engine.rangePriorities.at(-1)).toMatchObject({
      startByte: 4500,
      endByte: 6999,
    });

    const recovered = await playable.control?.recover();
    expect(recovered).toBe('http://127.0.0.1:43124/media/route-2');
    expect(engine.openCount).toBe(1);
    expect(stopped).toContain('route-1');

    await playable.cleanup?.();
  });
});
