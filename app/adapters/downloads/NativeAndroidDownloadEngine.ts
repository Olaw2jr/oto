import {NativeEventEmitter, NativeModules} from 'react-native';

import type {MediaSource} from '../../domain';
import type {
  DownloadEngine,
  DownloadRequest,
  DownloadStatus,
} from '../../downloads';

export type NativeDownloadsBridge = {
  start(request: DownloadRequest): Promise<void>;
  remove(id: string): Promise<void>;
  setWifiOnly(wifiOnly: boolean): Promise<void>;
  list(): Promise<DownloadStatus[]>;
  playbackSource(id: string): Promise<MediaSource | null>;
};

type Subscribe = (listener: (status: DownloadStatus) => void) => () => void;

const subscribeToNativeDownloads: Subscribe = listener => {
  const subscription = new NativeEventEmitter(NativeModules.OtoDownloads).addListener(
    'oto-downloads',
    status => listener(status as unknown as DownloadStatus),
  );
  return () => subscription.remove();
};

// Android downloads via Media3 DownloadService (OtoDownloadsModule).
export class NativeAndroidDownloadEngine implements DownloadEngine {
  constructor(
    private readonly bridge: NativeDownloadsBridge = NativeModules.OtoDownloads,
    private readonly subscribeNative: Subscribe = subscribeToNativeDownloads,
  ) {}

  start(request: DownloadRequest): Promise<void> {
    return this.bridge.start(request);
  }

  remove(id: string): Promise<void> {
    return this.bridge.remove(id);
  }

  setWifiOnly(wifiOnly: boolean): Promise<void> {
    return this.bridge.setWifiOnly(wifiOnly);
  }

  list(): Promise<DownloadStatus[]> {
    return this.bridge.list();
  }

  playbackSource(id: string): Promise<MediaSource | null> {
    return this.bridge.playbackSource(id);
  }

  subscribe(listener: (status: DownloadStatus) => void): () => void {
    return this.subscribeNative(listener);
  }
}
