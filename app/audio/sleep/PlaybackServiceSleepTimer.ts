import type {SleepTimerStore} from './types';

export class PlaybackServiceSleepTimer {
  private handling = false;

  constructor(
    private readonly store: SleepTimerStore,
    private readonly pause: () => Promise<void>,
    private readonly now: () => number = Date.now,
  ) {}

  private async pauseAndClear(): Promise<void> {
    if (this.handling) {
      return;
    }
    this.handling = true;
    try {
      await this.store.clear();
      await this.pause();
    } finally {
      this.handling = false;
    }
  }

  async onProgress(): Promise<void> {
    const state = await this.store.get();
    if (
      state?.kind === 'deadline' &&
      state.deadlineAtMs <= this.now()
    ) {
      await this.pauseAndClear();
    }
  }

  async onActiveTrackChanged(
    lastIndex?: number,
    index?: number,
  ): Promise<void> {
    const state = await this.store.get();
    if (
      state?.kind === 'chapter' &&
      lastIndex === state.trackIndex &&
      index !== state.trackIndex
    ) {
      if (index !== undefined) {
        await this.pauseAndClear();
      } else {
        await this.store.clear();
      }
    }
  }

  async onQueueEnded(trackIndex: number): Promise<void> {
    const state = await this.store.get();
    if (
      state?.kind === 'chapter' &&
      state.trackIndex === trackIndex
    ) {
      await this.store.clear();
    }
  }
}
