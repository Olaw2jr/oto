import {NativeModules, Platform} from 'react-native';

import type {
  NativeTorrentBridge,
} from '../../transports/torrent/NativeTorrentEngine';
import type {
  NativeRangeServer,
} from '../../transports/torrent/LocalhostRangeGateway';
import type {
  TorrentFile,
  TorrentFilePriority,
  TorrentFileProgress,
  TorrentFileSelector,
  TorrentSession,
} from '../../transports/torrent/TorrentEngine';
import type {TorrentMediaSource} from '../../domain';

export interface NativeAndroidTorrentModule {
  open(
    source: TorrentMediaSource,
    resumeData?: string,
  ): Promise<TorrentSession>;
  close(sessionId: string): Promise<void>;
  selectFile(
    sessionId: string,
    selector: TorrentFileSelector,
  ): Promise<TorrentFile>;
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
  getProgress(
    sessionId: string,
    fileIndex: number,
  ): Promise<TorrentFileProgress>;
  exportResumeData(sessionId: string): Promise<string | null>;
  startRangeServer(input: {
    sessionId: string;
    fileIndex: number;
  }): Promise<{routeId: string; port: number}>;
  stopRangeServer(routeId: string): Promise<void>;
}

export class NativeAndroidTorrentBridge
  implements NativeTorrentBridge, NativeRangeServer {
  constructor(private readonly native: NativeAndroidTorrentModule) {}

  open(
    source: TorrentMediaSource,
    resumeData?: string,
  ): Promise<TorrentSession> {
    if (!source.trustedSourceId) {
      return Promise.reject(
        new Error(
          'Torrent source must be authorized by a trusted source before native open',
        ),
      );
    }
    return this.native.open(source, resumeData);
  }

  close(sessionId: string): Promise<void> {
    return this.native.close(sessionId);
  }

  selectFile(
    sessionId: string,
    selector: TorrentFileSelector,
  ): Promise<TorrentFile> {
    return this.native.selectFile(sessionId, selector);
  }

  setFilePriority(
    sessionId: string,
    fileIndex: number,
    priority: TorrentFilePriority,
  ): Promise<void> {
    return this.native.setFilePriority(
      sessionId,
      fileIndex,
      priority,
    );
  }

  prioritizeRange(
    sessionId: string,
    fileIndex: number,
    startByte: number,
    endByte: number,
  ): Promise<void> {
    return this.native.prioritizeRange(
      sessionId,
      fileIndex,
      startByte,
      endByte,
    );
  }

  getProgress(
    sessionId: string,
    fileIndex: number,
  ): Promise<TorrentFileProgress> {
    return this.native.getProgress(sessionId, fileIndex);
  }

  exportResumeData(sessionId: string): Promise<string | null> {
    return this.native.exportResumeData(sessionId);
  }

  async start(input: {
    sessionId: string;
    fileIndex: number;
  }): Promise<{routeId: string; port: number}> {
    const route = await this.native.startRangeServer(input);
    if (
      !route.routeId ||
      !Number.isInteger(route.port) ||
      route.port < 1 ||
      route.port > 65535
    ) {
      throw new Error(
        'Native torrent module returned an invalid loopback route',
      );
    }
    return route;
  }

  stop(routeId: string): Promise<void> {
    return this.native.stopRangeServer(routeId);
  }
}

export const createNativeAndroidTorrentBridge =
  (): NativeAndroidTorrentBridge => {
    if (Platform.OS !== 'android') {
      throw new Error(
        'Native Android torrent runtime is only available on Android',
      );
    }
    const native = NativeModules.OtoTorrent as
      | NativeAndroidTorrentModule
      | undefined;
    if (!native) {
      throw new Error('OtoTorrent native module is unavailable');
    }
    return new NativeAndroidTorrentBridge(native);
  };
