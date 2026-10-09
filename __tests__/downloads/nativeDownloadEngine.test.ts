import {NativeDownloadEngine} from '../../app/adapters/downloads';

const bridge = () => ({
  start: jest.fn(async () => {}),
  remove: jest.fn(async () => {}),
  setWifiOnly: jest.fn(async () => {}),
  list: jest.fn(async () => [
    {id: 'asset-1', bookId: 'book-1', state: 'completed', bytesDownloaded: 10, totalBytes: 10},
  ]),
  playbackSource: jest.fn(async () => ({kind: 'https', uri: 'https://archive.org/c1.mp3', trustedSourceId: 'internetarchive'})),
});

describe('NativeDownloadEngine', () => {
  it('passes requests and queries through to the native module', async () => {
    const native = bridge();
    const engine = new NativeDownloadEngine(native as any, () => () => {});
    const request = {id: 'asset-1', bookId: 'book-1', uri: 'https://archive.org/c1.mp3', cacheKey: 'r:c', title: 'Chapter 1', wifiOnly: true};

    await engine.start(request);
    await engine.setWifiOnly(false);
    await engine.remove('asset-1');

    expect(native.start).toHaveBeenCalledWith(request);
    expect(native.setWifiOnly).toHaveBeenCalledWith(false);
    expect(native.remove).toHaveBeenCalledWith('asset-1');
    expect(await engine.list()).toHaveLength(1);
    expect(await engine.playbackSource('asset-1')).toEqual({
      kind: 'https',
      uri: 'https://archive.org/c1.mp3',
      trustedSourceId: 'internetarchive',
    });
  });

  it('forwards native progress events to subscribers', () => {
    let emit: (status: any) => void = () => {};
    const engine = new NativeDownloadEngine(bridge() as any, listener => {
      emit = listener;
      return () => {};
    });
    const listener = jest.fn();
    engine.subscribe(listener);
    emit({id: 'asset-1', bookId: 'book-1', state: 'downloading', bytesDownloaded: 5, totalBytes: 10});
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({state: 'downloading'}));
  });
});
