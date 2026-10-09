import type {MediaSource} from '../domain';
import type {DownloadEngine, DownloadStatus} from './types';

// Used until the platform's native downloader is wired in.
export class UnavailableDownloadEngine implements DownloadEngine {
  async start(): Promise<void> {
    throw new Error("Downloads aren't available on this device yet");
  }
  async remove(): Promise<void> {}
  async setWifiOnly(): Promise<void> {}
  async list(): Promise<DownloadStatus[]> {
    return [];
  }
  async playbackSource(): Promise<MediaSource | null> {
    return null;
  }
  subscribe(): () => void {
    return () => {};
  }
}
