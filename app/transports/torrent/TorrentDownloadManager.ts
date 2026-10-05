import type {TorrentMediaSource} from '../../domain';
import type {
  TorrentEngine,
  TorrentFile,
  TorrentFileProgress,
  TorrentSessionId,
} from './TorrentEngine';
import type {TorrentResumeStore} from './TorrentResumeStore';

export type ActiveTorrentDownload = {
  assetId: string;
  sessionId: TorrentSessionId;
  file: TorrentFile;
};

type InternalDownload = ActiveTorrentDownload & {
  source: TorrentMediaSource;
};

export class TorrentDownloadManager {
  private readonly active = new Map<string, InternalDownload>();

  constructor(
    private readonly engine: TorrentEngine,
    private readonly resume: TorrentResumeStore,
  ) {}

  private async chooseFile(
    sessionId: TorrentSessionId,
    source: TorrentMediaSource,
    files: TorrentFile[],
  ): Promise<TorrentFile> {
    if (source.fileIndex !== undefined || source.filePath !== undefined) {
      return this.engine.selectFile(sessionId, {
        fileIndex: source.fileIndex,
        filePath: source.filePath,
      });
    }
    if (files.length === 1) {
      return files[0];
    }
    throw new Error('Torrent source must identify a file when the torrent contains multiple files');
  }

  async start(
    assetId: string,
    source: TorrentMediaSource,
  ): Promise<ActiveTorrentDownload> {
    if (this.active.has(assetId)) {
      throw new Error(`Torrent download is already active: ${assetId}`);
    }

    const resumeData = await this.resume.load(assetId);
    const session = await this.engine.open(source, resumeData ?? undefined);
    const file = await this.chooseFile(session.id, source, session.files);
    await this.engine.setFilePriority(session.id, file.index, 'high');

    const active = {assetId, source, sessionId: session.id, file};
    this.active.set(assetId, active);
    return active;
  }

  async progress(assetId: string): Promise<TorrentFileProgress> {
    const active = this.active.get(assetId);
    if (!active) throw new Error(`No active torrent download: ${assetId}`);
    return this.engine.getProgress(active.sessionId, active.file.index);
  }

  async checkpoint(assetId: string): Promise<void> {
    const active = this.active.get(assetId);
    if (!active) throw new Error(`No active torrent download: ${assetId}`);
    const data = await this.engine.exportResumeData(active.sessionId);
    if (data) await this.resume.save(assetId, data);
  }

  async pause(assetId: string): Promise<void> {
    const active = this.active.get(assetId);
    if (!active) return;
    await this.checkpoint(assetId);
    await this.engine.setFilePriority(active.sessionId, active.file.index, 'off');
    await this.engine.close(active.sessionId);
    this.active.delete(assetId);
  }

  async complete(assetId: string): Promise<void> {
    const active = this.active.get(assetId);
    if (active) {
      await this.engine.close(active.sessionId);
      this.active.delete(assetId);
    }
    await this.resume.remove(assetId);
  }
}
