import {HttpsTransport, LocalFileTransport} from '../../../app/transports';
import type {DownloadHandle} from '../../../app/transports';

const handle: DownloadHandle = {
  id: 'download-1',
  wait: async () => ({uri: 'file:///downloads/book.mp3'}),
  cancel: async () => {},
};

describe('standard content transports', () => {
  it('prepares HTTPS sources and delegates downloads to the file transfer client', async () => {
    const starts: Array<[string, string]> = [];
    const transport = new HttpsTransport({
      start: async (uri, destination) => {
        starts.push([uri, destination.uri]);
        return handle;
      },
    });
    const source = {kind: 'https' as const, uri: 'https://example.test/book.mp3'};

    expect(await transport.prepare(source)).toEqual({
      uri: source.uri,
      transport: 'https',
    });
    expect(await transport.download(source, {uri: 'file:///downloads/book.mp3'})).toBe(handle);
    expect(starts[0]).toEqual([source.uri, 'file:///downloads/book.mp3']);
  });

  it('prepares local file and Android content URIs without a network transport', async () => {
    const transport = new LocalFileTransport();

    expect((await transport.prepare({kind: 'local', uri: 'file:///book.m4b'})).uri).toBe('file:///book.m4b');
    expect((await transport.prepare({kind: 'local', uri: 'content://library/book'})).uri).toBe('content://library/book');
  });

  it('rejects malformed URI schemes', async () => {
    await expect(new HttpsTransport({start: async () => handle}).prepare({
      kind: 'https',
      uri: 'http://example.test/book.mp3',
    })).rejects.toThrow('HTTPS source');
  });
});
