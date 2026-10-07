export type SleepTimerState =
  | {
      kind: 'deadline';
      deadlineAtMs: number;
    }
  | {
      kind: 'chapter';
      trackIndex: number;
    };

export interface SleepTimerStore {
  get(): Promise<SleepTimerState | null>;
  set(state: SleepTimerState): Promise<void>;
  clear(): Promise<void>;
}
