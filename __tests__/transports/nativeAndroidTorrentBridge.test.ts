import {
  NativeAndroidTorrentBridge,
  type NativeAndroidTorrentModule,
} from '../../app/adapters/torrent/NativeAndroidTorrentBridge';

describe('NativeAndroidTorrentBridge', () => {
  it('maps torrent engine and range-server contracts onto one native module', async () => {
    const module: NativeAndroidTorrentModule = {
      open: jest.fn(async () => ({
        id: 'session-1',
        infoHash: 'abc',
        files: [{index: 0, path: 'book.mp3', sizeBytes: 1000}],
      })),
      close: jest.fn(async () => {}),
      selectFile: jest.fn(async () => ({
        index: 0,
        path: 'book.mp3',
        sizeBytes: 1000,
      })),
      setFilePriority: jest.fn(async () => {}),
      prioritizeRange: jest.fn(async () => {}),
      getProgress: jest.fn(async () => ({
        downloadedBytes: 500,
        totalBytes: 1000,
        complete: false,
      })),
      exportResumeData: jest.fn(async () => 'resume'),
      startRangeServer: jest.fn(async () => ({
        routeId: 'secure-route',
        port: 43123,
      })),
      stopRangeServer: jest.fn(async () => {}),
    };
    const bridge = new NativeAndroidTorrentBridge(module);
    const source = {
      kind: 'torrent' as const,
      magnetUri: 'magnet:?xt=urn:btih:abc',
      fileIndex: 0,
      trustedSourceId: 'internetarchive',
    };

    const session = await bridge.open(source, 'resume-v1');
    const route = await bridge.start({
      sessionId: session.id,
      fileIndex: 0,
    });

    expect(module.open).toHaveBeenCalledWith(source, 'resume-v1');
    expect(route).toEqual({routeId: 'secure-route', port: 43123});

    await bridge.prioritizeRange(session.id, 0, 100, 300);
    await bridge.stop(route.routeId);

    expect(module.prioritizeRange).toHaveBeenCalledWith(
      session.id,
      0,
      100,
      300,
    );
    expect(module.stopRangeServer).toHaveBeenCalledWith('secure-route');
  });

  it('refuses to open a torrent source without trusted-source provenance', async () => {
    const module = {
      open: jest.fn(),
    } as unknown as NativeAndroidTorrentModule;
    const bridge = new NativeAndroidTorrentBridge(module);

    await expect(
      bridge.open({
        kind: 'torrent',
        magnetUri: 'magnet:?xt=urn:btih:abc',
      }),
    ).rejects.toThrow('authorized by a trusted source');
    expect(module.open).not.toHaveBeenCalled();
  });

  it('rejects native range responses that are not valid loopback routes', async () => {
    const module = {
      open: jest.fn(),
      close: jest.fn(),
      selectFile: jest.fn(),
      setFilePriority: jest.fn(),
      prioritizeRange: jest.fn(),
      getProgress: jest.fn(),
      exportResumeData: jest.fn(),
      startRangeServer: jest.fn(async () => ({
        routeId: '',
        port: 0,
      })),
      stopRangeServer: jest.fn(),
    } as unknown as NativeAndroidTorrentModule;

    const bridge = new NativeAndroidTorrentBridge(module);

    await expect(
      bridge.start({sessionId: 'session-1', fileIndex: 0}),
    ).rejects.toThrow('invalid loopback route');
  });
});
