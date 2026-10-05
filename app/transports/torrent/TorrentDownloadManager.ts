import type {TorrentMediaSource} from '../../domain';
import type {
  TorrentEngine,
  TorrentFile,
  TorrentFileProgress,
} from './TorrentEngine';
import type {TorrentResumeStore} from './TorrentResumeStore';
import {
  TorrentSessionPool,
  type TorrentSessionLease,
} from './TorrentSessionPool';

export type ActiveTorrentDownload = {
  assetId: string;
  sessionId: string;
  file: TorrentFile;
};

type InternalDownload = ActiveTorrentDownload & {
  source: TorrentMediaSource;
  lease: TorrentSessionLease;
};

export class TorrentDownloadManager {
  private readonly active = new Map<string, InternalDownload>();
  private readonly pool: TorrentSessionPool;

  constructor(
    engineOrPool: TorrentEngine | TorrentSessionPool,
    private readonly resume: TorrentResumeStore,
  ) {
    this.pool =
      engineOrPool instanceof TorrentSessionPool
        ? engineOrPool
        : new TorrentSessionPool(engineOrPool);
  }

  private async chooseFile(
    lease: TorrentSessionLease,
    source: TorrentMediaSource,
  ): Promise<TorrentFile> {
    if (source.fileIndex !== undefined || source.filePath !== undefined) {
      return this.pool.selectFile(lease, {
        fileIndex: source.fileIndex,
        filePath: source.filePath,
      });
    }
    if (lease.session.files.length === 1) {
      return lease.session.files[0];
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
    const lease = await this.pool.acquire(source, resumeData ?? undefined);
    try {
      const file = await this.chooseFile(lease, source);
      await this.pool.retainFile(lease, file.index);

      const active = {
        assetId,
        source,
        lease,
        sessionId: lease.session.id,
        file,
      };
      this.active.set(assetId, active);
      return active;
    } catch (error) {
      await this.pool.release(lease);
      throw error;
    }
  }

  async progress(assetId: string): Promise<TorrentFileProgress> {
    const active = this.active.get(assetId);
    if (!active) throw new Error(`No active torrent download: ${assetId}`);
    return this.pool.progress(active.lease, active.file.index);
  }

  async checkpoint(assetId: string): Promise<void> {
    const active = this.active.get(assetId);
    if (!active) throw new Error(`No active torrent download: ${assetId}`);
    const data = await this.pool.exportResumeData(active.lease);
    if (data) await this.resume.save(assetId, data);
  }

  async pause(assetId: string): Promise<void> {
    const active = this.active.get(assetId);
    if (!active) return;
    await this.checkpoint(assetId);
    await this.pool.releaseFile(active.lease, active.file.index);
    await this.pool.release(active.lease);
    this.active.delete(assetId);
  }

  async complete(assetId: string): Promise<void> {
    const active = this.active.get(assetId);
    if (active) {
      await this.pool.releaseFile(active.lease, active.file.index);
      await this.pool.release(active.lease);
      this.active.delete(assetId);
    }
    await this.resume.remove(assetId);
  }
}
