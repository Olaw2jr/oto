import type {
  SleepTimerState,
  SleepTimerStore,
} from './types';

export class SleepTimerController {
  constructor(
    protected readonly store: SleepTimerStore,
    private readonly now: () => number = Date.now,
  ) {}

  async setMinutes(minutes: number): Promise<void> {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      throw new Error('Sleep timer minutes must be positive finite minutes');
    }
    await this.store.set({
      kind: 'deadline',
      deadlineAtMs: this.now() + minutes * 60 * 1000,
    });
  }

  async setEndOfChapter(trackIndex: number): Promise<void> {
    if (!Number.isInteger(trackIndex) || trackIndex < 0) {
      throw new Error('Sleep timer chapter index must be non-negative');
    }
    await this.store.set({
      kind: 'chapter',
      trackIndex,
    });
  }

  clear(): Promise<void> {
    return this.store.clear();
  }

  getState(): Promise<SleepTimerState | null> {
    return this.store.get();
  }
}
