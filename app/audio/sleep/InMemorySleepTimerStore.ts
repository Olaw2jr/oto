import type {
  SleepTimerState,
  SleepTimerStore,
} from './types';

export class InMemorySleepTimerStore implements SleepTimerStore {
  private state: SleepTimerState | null = null;

  async get(): Promise<SleepTimerState | null> {
    return this.state ? {...this.state} : null;
  }

  async set(state: SleepTimerState): Promise<void> {
    this.state = {...state};
  }

  async clear(): Promise<void> {
    this.state = null;
  }
}
