import type {
  BackgroundScheduleOptions,
  BackgroundTaskHandler,
  BackgroundTaskName,
} from './types';

export interface BackgroundScheduler {
  register(
    name: BackgroundTaskName,
    handler: BackgroundTaskHandler,
  ): () => void;
  schedule(
    name: BackgroundTaskName,
    options?: BackgroundScheduleOptions,
  ): Promise<void>;
  cancel(name: BackgroundTaskName): Promise<void>;
}
