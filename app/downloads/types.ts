import type {MediaSource} from '../domain';

export type DownloadState =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'failed';

export type DownloadRequest = {
  // The media asset id; one download per chapter asset.
  id: string;
  bookId: string;
  uri: string;
  // Matches the playback cache key, so Android plays it from the download.
  cacheKey: string;
  title: string;
  trustedSourceId?: string;
  sizeBytes?: number;
  wifiOnly: boolean;
};

export type DownloadStatus = {
  id: string;
  bookId: string;
  state: DownloadState;
  bytesDownloaded: number;
  totalBytes?: number;
  error?: string;
};

// The platform's background downloader: Media3 DownloadService on Android,
// a background URLSession on iOS.
export interface DownloadEngine {
  start(request: DownloadRequest): Promise<void>;
  remove(id: string): Promise<void>;
  // Wi-Fi only applies to downloads already queued, too.
  setWifiOnly(wifiOnly: boolean): Promise<void>;
  list(): Promise<DownloadStatus[]>;
  // How to play a completed download: a file on iOS, the cache-backed
  // HTTPS source on Android. Null until it's complete.
  playbackSource(id: string): Promise<MediaSource | null>;
  subscribe(listener: (status: DownloadStatus) => void): () => void;
  // Bytes free where downloads are stored, or null if unknown.
  freeSpace(): Promise<number | null>;
}

export type BookDownloadStatus = {
  state: 'none' | DownloadState;
  chaptersDone: number;
  chapters: number;
  bytesDownloaded: number;
  totalBytes: number;
};
