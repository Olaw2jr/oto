import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  SleepTimerState,
  SleepTimerStore,
} from './types';

const isState = (value: unknown): value is SleepTimerState => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const state = value as Record<string, unknown>;
  if (state.kind === 'deadline') {
    return (
      typeof state.deadlineAtMs === 'number' &&
      Number.isFinite(state.deadlineAtMs)
    );
  }
  if (state.kind === 'chapter') {
    return (
      typeof state.trackIndex === 'number' &&
      Number.isInteger(state.trackIndex) &&
      state.trackIndex >= 0
    );
  }
  return false;
};

export class AsyncStorageSleepTimerStore implements SleepTimerStore {
  constructor(private readonly key: string) {}

  async get(): Promise<SleepTimerState | null> {
    const raw = await AsyncStorage.getItem(this.key);
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return isState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async set(state: SleepTimerState): Promise<void> {
    await AsyncStorage.setItem(this.key, JSON.stringify(state));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(this.key);
  }
}
