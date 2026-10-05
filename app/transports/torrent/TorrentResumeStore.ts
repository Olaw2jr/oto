export interface TorrentResumeStore {
  load(assetId: string): Promise<string | null>;
  save(assetId: string, data: string): Promise<void>;
  remove(assetId: string): Promise<void>;
}

export class InMemoryTorrentResumeStore implements TorrentResumeStore {
  private readonly values = new Map<string, string>();

  async load(assetId: string): Promise<string | null> {
    return this.values.get(assetId) ?? null;
  }

  async save(assetId: string, data: string): Promise<void> {
    this.values.set(assetId, data);
  }

  async remove(assetId: string): Promise<void> {
    this.values.delete(assetId);
  }
}
