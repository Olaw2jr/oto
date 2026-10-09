import type {MediaSource} from '../../domain';
import type {
  DownloadEngine,
  DownloadRequest,
  DownloadState,
  DownloadStatus,
} from '../types';

export class FakeDownloadEngine implements DownloadEngine {
  readonly requests: DownloadRequest[] = [];
  wifiOnly = true;
  freeBytes: number | null = Number.MAX_SAFE_INTEGER;
  private readonly statuses = new Map<string, DownloadStatus>();
  private readonly listeners = new Set<(status: DownloadStatus) => void>();

  async start(request: DownloadRequest): Promise<void> {
    this.requests.push(request);
    this.wifiOnly = request.wifiOnly;
    this.update({
      id: request.id,
      bookId: request.bookId,
      state: 'queued',
      bytesDownloaded: 0,
      totalBytes: request.sizeBytes,
    });
  }

  async remove(id: string): Promise<void> {
    this.statuses.delete(id);
  }

  async setWifiOnly(wifiOnly: boolean): Promise<void> {
    this.wifiOnly = wifiOnly;
  }

  async list(): Promise<DownloadStatus[]> {
    return [...this.statuses.values()];
  }

  async playbackSource(id: string): Promise<MediaSource | null> {
    return this.statuses.get(id)?.state === 'completed'
      ? {kind: 'local', uri: `file:///downloads/${id}`}
      : null;
  }

  subscribe(listener: (status: DownloadStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async freeSpace(): Promise<number | null> {
    return this.freeBytes;
  }

  // Test helper: report progress for a download.
  progress(id: string, bytesDownloaded: number, totalBytes: number, state: DownloadState): void {
    const current = this.statuses.get(id);
    if (!current) throw new Error(`Unknown download: ${id}`);
    this.update({...current, bytesDownloaded, totalBytes, state});
  }

  private update(status: DownloadStatus): void {
    this.statuses.set(status.id, status);
    this.listeners.forEach(listener => listener(status));
  }
}
