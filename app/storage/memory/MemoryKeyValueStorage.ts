import type {KeyValueStorage} from '../KeyValueStorage';

const separator = ':';

export class MemoryKeyValueStorage implements KeyValueStorage {
  constructor(
    private readonly values = new Map<string, string>(),
    private readonly prefix = '',
  ) {}

  private key(key: string): string {
    return this.prefix ? `${this.prefix}${separator}${key}` : key;
  }

  async getString(key: string): Promise<string | null> {
    return this.values.get(this.key(key)) ?? null;
  }

  async setString(key: string, value: string): Promise<void> {
    this.values.set(this.key(key), value);
  }

  async remove(key: string): Promise<void> {
    this.values.delete(this.key(key));
  }

  async clear(): Promise<void> {
    if (!this.prefix) {
      this.values.clear();
      return;
    }

    const prefix = `${this.prefix}${separator}`;
    for (const key of this.values.keys()) {
      if (key.startsWith(prefix)) {
        this.values.delete(key);
      }
    }
  }

  namespace(name: string): KeyValueStorage {
    const prefix = this.prefix
      ? `${this.prefix}${separator}${name}`
      : name;
    return new MemoryKeyValueStorage(this.values, prefix);
  }
}
