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

  it('resolves an archive-relative file path to one exact torrent manifest entry', async () => {
    const engine = new FakeTorrentEngine([
      {index: 0, path: 'archive-root/chapter-01.mp3', sizeBytes: 10_000},
      {index: 1, path: 'archive-root/chapter-02.mp3', sizeBytes: 10_000},
    ]);
    const pool = new TorrentSessionPool(engine);
    const gateway = new LocalhostRangeGateway({
      start: async input => ({
        routeId: `route-${input.fileIndex}`,
        port: 43123,
      }),
      stop: async () => {},
    });
    const streaming = new TorrentStreamTransport(pool, gateway);

    const playable = await streaming.prepare({
      kind: 'torrent',
      magnetUri: 'magnet:?xt=urn:btih:archive',
      filePath: 'chapter-02.mp3',
    });

    expect(playable.uri).toBe('http://127.0.0.1:43123/media/route-1');
    await playable.cleanup?.();
  });

  it('rejects an archive-relative path when multiple manifest entries match', async () => {
    const engine = new FakeTorrentEngine([
      {index: 0, path: 'disc-1/chapter.mp3', sizeBytes: 10_000},
      {index: 1, path: 'disc-2/chapter.mp3', sizeBytes: 10_000},
    ]);
    const streaming = new TorrentStreamTransport(
      engine,
      new LocalhostRangeGateway({
        start: async () => ({routeId: 'route', port: 43123}),
        stop: async () => {},
      }),
    );

    await expect(
      streaming.prepare({
        kind: 'torrent',
        magnetUri: 'magnet:?xt=urn:btih:ambiguous',
        filePath: 'chapter.mp3',
      }),
    ).rejects.toThrow('Torrent file selector does not identify one exact file');
    expect(engine.closedSessions).toContain('fake-session');
  });
});

// #135: preparing a whole chapter queue marked every chapter's opening as
// urgent and queued every chapter for full download, so the chapter being
// played waited behind all the others.
describe('torrent streaming priorities', () => {
  const source = {
    kind: 'torrent' as const,
    magnetUri: 'magnet:?xt=urn:btih:abc',
    fileIndex: 0,
    trustedSourceId: 'internetarchive',
  };
  const setup = () => {
    const engine = new FakeTorrentEngine([
      {index: 0, path: 'book.mp3', sizeBytes: 10_000},
    ]);
    const pool = new TorrentSessionPool(engine);
    const gateway = new LocalhostRangeGateway({
      start: async () => ({routeId: 'route-1', port: 43123}),
      stop: async () => {},
    });
    return {
      engine,
      pool,
      streaming: new TorrentStreamTransport(pool, gateway),
      downloads: new TorrentDownloadManager(pool, new InMemoryTorrentResumeStore()),
    };
  };

  it('leaves a prepared but unplayed chapter alone', async () => {
    const {engine, streaming} = setup();
    await streaming.prepare(source, {durationSec: 100});

    expect(engine.rangePriorities).toEqual([]);
    expect(engine.filePriorities.get('fake-session:0')).toBe('off');
  });

  it('prioritizes the range around where playback starts', async () => {
    const {engine, streaming} = setup();
    await streaming.prepare(source, {
      durationSec: 100,
      positionSec: 10,
      bufferAheadSec: 20,
      lookBehindSec: 5,
    });

    expect(engine.rangePriorities.at(-1)).toMatchObject({
      startByte: 500,
      endByte: 2999,
    });
    expect(engine.filePriorities.get('fake-session:0')).toBe('off');
  });

  it('still downloads the whole file when an offline download wants it', async () => {
    const {engine, streaming, downloads} = setup();
    await streaming.prepare(source, {durationSec: 100});
    await downloads.start('asset-1', source);

    expect(engine.filePriorities.get('fake-session:0')).toBe('high');
  });
});
