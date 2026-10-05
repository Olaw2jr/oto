import type {TorrentMediaSource} from '../../domain';

export type TorrentSessionId = string;

export type TorrentFile = {
  index: number;
  path: string;
  sizeBytes: number;
};

export type TorrentSession = {
  id: TorrentSessionId;
  infoHash?: string;
  files: TorrentFile[];
};

export type TorrentFileSelector = {
  fileIndex?: number;
  filePath?: string;
};

export type TorrentFilePriority = 'off' | 'normal' | 'high';

export type TorrentFileProgress = {
  downloadedBytes: number;
  totalBytes: number;
  complete: boolean;
};

export interface TorrentEngine {
  open(
    source: TorrentMediaSource,
    resumeData?: string,
  ): Promise<TorrentSession>;
  close(sessionId: TorrentSessionId): Promise<void>;
  selectFile(
    sessionId: TorrentSessionId,
    selector: TorrentFileSelector,
  ): Promise<TorrentFile>;
  setFilePriority(
    sessionId: TorrentSessionId,
    fileIndex: number,
    priority: TorrentFilePriority,
  ): Promise<void>;
  prioritizeRange(
    sessionId: TorrentSessionId,
    fileIndex: number,
    startByte: number,
    endByte: number,
  ): Promise<void>;
  getProgress(
    sessionId: TorrentSessionId,
    fileIndex: number,
  ): Promise<TorrentFileProgress>;
  exportResumeData(sessionId: TorrentSessionId): Promise<string | null>;
}
