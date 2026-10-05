import type {TorrentMediaSource} from '../../domain';
import type {
  TorrentEngine,
  TorrentFile,
  TorrentFilePriority,
  TorrentFileProgress,
  TorrentFileSelector,
  TorrentSession,
  TorrentSessionId,
} from './TorrentEngine';

export class FakeTorrentEngine implements TorrentEngine {
  readonly filePriorities = new Map<string, TorrentFilePriority>();
  readonly rangePriorities: Array<{
    sessionId: string;
    fileIndex: number;
    startByte: number;
    endByte: number;
  }> = [];
  readonly progress = new Map<string, TorrentFileProgress>();
  readonly closedSessions: string[] = [];
  lastResumeData?: string;
  private readonly sessionId = 'fake-session';

  constructor(private readonly files: TorrentFile[]) {}

  async open(
    source: TorrentMediaSource,
    resumeData?: string,
  ): Promise<TorrentSession> {
    if (!source.torrentUri && !source.magnetUri && !source.infoHash) {
      throw new Error('Torrent source requires a descriptor, magnet URI or info hash');
    }
    this.lastResumeData = resumeData;
    return {
      id: this.sessionId,
      infoHash: source.infoHash,
      files: this.files,
    };
  }

  async close(sessionId: TorrentSessionId): Promise<void> {
    this.closedSessions.push(sessionId);
  }

  async selectFile(
    sessionId: TorrentSessionId,
    selector: TorrentFileSelector,
  ): Promise<TorrentFile> {
    if (sessionId !== this.sessionId) throw new Error('Unknown torrent session');
    const file = this.files.find(candidate =>
      selector.fileIndex !== undefined
        ? candidate.index === selector.fileIndex
        : selector.filePath !== undefined
        ? candidate.path === selector.filePath
        : false,
    );
    if (!file) throw new Error('Torrent file not found');
    return file;
  }

  async setFilePriority(
    sessionId: TorrentSessionId,
    fileIndex: number,
    priority: TorrentFilePriority,
  ): Promise<void> {
    this.filePriorities.set(`${sessionId}:${fileIndex}`, priority);
  }

  async prioritizeRange(
    sessionId: TorrentSessionId,
    fileIndex: number,
    startByte: number,
    endByte: number,
  ): Promise<void> {
    this.rangePriorities.push({sessionId, fileIndex, startByte, endByte});
  }

  async getProgress(
    sessionId: TorrentSessionId,
    fileIndex: number,
  ): Promise<TorrentFileProgress> {
    return (
      this.progress.get(`${sessionId}:${fileIndex}`) ?? {
        downloadedBytes: 0,
        totalBytes: this.files.find(file => file.index === fileIndex)?.sizeBytes ?? 0,
        complete: false,
      }
    );
  }

  async exportResumeData(_sessionId: TorrentSessionId): Promise<string | null> {
    return 'fake-resume-data';
  }
}
