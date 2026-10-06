import {
  FakeContentTransport,
  TransportRegistry,
} from '../../app/transports';
import type {MediaSource} from '../../app/domain';

describe('content transport boundary', () => {
  it('selects a replaceable transport by media source', async () => {
    const https = new FakeContentTransport('https');
    const torrent = new FakeContentTransport('torrent');
    const registry = new TransportRegistry([https, torrent]);
    const source: MediaSource = {
      kind: 'torrent',
      torrentUri: 'https://example.test/book.torrent',
      filePath: 'book.mp3',
      trustedSourceId: 'test',
    };

    const transport = registry.forSource(source);
    const playable = await transport.prepare(source);

    expect(transport).toBe(torrent);
    expect(playable.transport).toBe('torrent');
    expect(playable.uri).toContain('fake://torrent/');
  });

  it('fails when no transport supports the source', () => {
    const registry = new TransportRegistry([]);
    expect(() => registry.forSource({kind: 'local', uri: 'file:///book.mp3'})).toThrow(
      'No content transport',
    );
  });
});
