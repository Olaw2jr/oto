import type {KeyValueStorage} from '../../storage/KeyValueStorage';
import type {TorrentResumeStore} from './TorrentResumeStore';

export class KeyValueTorrentResumeStore
  implements TorrentResumeStore {
  constructor(private readonly storage: KeyValueStorage) {}

  load(assetId: string): Promise<string | null> {
    return this.storage.getString(assetId);
  }

  save(assetId: string, data: string): Promise<void> {
    return this.storage.setString(assetId, data);
  }

  remove(assetId: string): Promise<void> {
    return this.storage.remove(assetId);
  }
}
