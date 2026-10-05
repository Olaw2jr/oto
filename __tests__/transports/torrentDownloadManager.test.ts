import {
  FakeTorrentEngine,
  InMemoryTorrentResumeStore,
  TorrentDownloadManager,
} from '../../../app/transports/torrent';

describe('TorrentDownloadManager', () => {
  it('restores resume data, selects the requested file and checkpoints state', async () => {
    const engine = new FakeTorrentEngine([
      {index: 0, path: 'cover.jpg', sizeBytes: 100},
      {index: 1, path: 'book.mp3', sizeBytes: 10_000},
    ]);
    const resume = new InMemoryTorrentResumeStore();
    await resume.save('asset-1', 'saved-resume');
    const manager = new TorrentDownloadManager(engine, resume);
    const source = {
      kind: 'torrent' as const,
      torrentUri: 'https://example.test/book.torrent',
      filePath: 'book.mp3',
      trustedSourceId: 'internetarchive',
    };

    const active = await manager.start('asset-1', source);
    expect(active.file.index).toBe(1);
    expect(engine.lastResumeData).toBe('saved-resume');
    expect(engine.filePriorities.get('fake-session:1')).toBe('high');

    await manager.checkpoint('asset-1');
    expect(await resume.load('asset-1')).toBe('fake-resume-data');
  });

  it('pauses by persisting state, disabling the file and closing the session', async () => {
    const engine = new FakeTorrentEngine([{index: 0, path: 'book.mp3', sizeBytes: 10}]);
    const resume = new InMemoryTorrentResumeStore();
    const manager = new TorrentDownloadManager(engine, resume);
    await manager.start('asset-1', {
      kind: 'torrent',
      magnetUri: 'magnet:?xt=urn:btih:abc',
      fileIndex: 0,
      trustedSourceId: 'internetarchive',
    });

    await manager.pause('asset-1');

    expect(engine.filePriorities.get('fake-session:0')).toBe('off');
    expect(engine.closedSessions).toContain('fake-session');
    await expect(manager.progress('asset-1')).rejects.toThrow('No active torrent download');
  });
});
