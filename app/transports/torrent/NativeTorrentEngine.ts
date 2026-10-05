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

export interface NativeTorrentBridge {
  open(source: TorrentMediaSource, resumeData?: string): Promise<TorrentSession>;
  close(sessionId: string): Promise<void>;
  selectFile(sessionId: string, selector: TorrentFileSelector): Promise<TorrentFile>;
  setFilePriority(
    sessionId: string,
    fileIndex: number,
    priority: TorrentFilePriority,
  ): Promise<void>;
  prioritizeRange(
    sessionId: string,
    fileIndex: number,
    startByte: number,
    endByte: number,
  ): Promise<void>;
  getProgress(sessionId: string, fileIndex: number): Promise<TorrentFileProgress>;
  exportResumeData(sessionId: string): Promise<string | null>;
}

export class NativeTorrentEngine implements TorrentEngine {
  constructor(private readonly bridge: NativeTorrentBridge) {}

  open(source: TorrentMediaSource, resumeData?: string): Promise<TorrentSession> {
    return this.bridge.open(source, resumeData);
  }
  close(sessionId: TorrentSessionId): Promise<void> {
    return this.bridge.close(sessionId);
  }
  selectFile(sessionId: TorrentSessionId, selector: TorrentFileSelector): Promise<TorrentFile> {
    return this.bridge.selectFile(sessionId, selector);
  }
  setFilePriority(sessionId: TorrentSessionId, fileIndex: number, priority: TorrentFilePriority): Promise<void> {
    return this.bridge.setFilePriority(sessionId, fileIndex, priority);
  }
  prioritizeRange(sessionId: TorrentSessionId, fileIndex: number, startByte: number, endByte: number): Promise<void> {
    return this.bridge.prioritizeRange(sessionId, fileIndex, startByte, endByte);
  }
  getProgress(sessionId: TorrentSessionId, fileIndex: number): Promise<TorrentFileProgress> {
    return this.bridge.getProgress(sessionId, fileIndex);
  }
  exportResumeData(sessionId: TorrentSessionId): Promise<string | null> {
    return this.bridge.exportResumeData(sessionId);
  }
}
