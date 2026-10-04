export interface KeyValueStorage {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  namespace(name: string): KeyValueStorage;
}
