import AsyncStorage from '@react-native-async-storage/async-storage';

import type {TorrentResumeStore} from './TorrentResumeStore';

export class AsyncStorageTorrentResumeStore
  implements TorrentResumeStore {
  constructor(private readonly prefix = 'oto.torrent.resume.') {}

  private key(assetId: string): string {
    return `${this.prefix}${encodeURIComponent(assetId)}`;
  }

  load(assetId: string): Promise<string | null> {
    return AsyncStorage.getItem(this.key(assetId));
  }

  save(assetId: string, data: string): Promise<void> {
    return AsyncStorage.setItem(this.key(assetId), data);
  }

  remove(assetId: string): Promise<void> {
    return AsyncStorage.removeItem(this.key(assetId));
  }
}
