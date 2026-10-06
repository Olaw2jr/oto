import {FakeTorrentEngine} from '../../app/transports/torrent/FakeTorrentEngine';

describe('torrent engine boundary', () => {
  it('opens a source, selects its file and records playback priority without a native client', async () => {
    const engine = new FakeTorrentEngine([
      {index: 0, path: 'cover.jpg', sizeBytes: 100},
      {index: 1, path: 'book.mp3', sizeBytes: 10_000},
    ]);
    const source = {
      kind: 'torrent' as const,
      torrentUri: 'https://example.test/book.torrent',
      filePath: 'book.mp3',
      trustedSourceId: 'internetarchive',
    };

    const session = await engine.open(source);
    const file = await engine.selectFile(session.id, {filePath: 'book.mp3'});
    await engine.setFilePriority(session.id, file.index, 'high');
    await engine.prioritizeRange(session.id, file.index, 1000, 3000);

    expect(file.index).toBe(1);
    expect(engine.filePriorities.get('fake-session:1')).toBe('high');
    expect(engine.rangePriorities.at(-1)).toEqual({
      sessionId: 'fake-session',
      fileIndex: 1,
      startByte: 1000,
      endByte: 3000,
    });
  });

  it('can restore opaque resume data when opening a session', async () => {
    const engine = new FakeTorrentEngine([{index: 0, path: 'book.mp3', sizeBytes: 10}]);
    await engine.open({kind: 'torrent', magnetUri: 'magnet:?xt=urn:btih:abc'}, 'resume-v1');

    expect(engine.lastResumeData).toBe('resume-v1');
  });
});
