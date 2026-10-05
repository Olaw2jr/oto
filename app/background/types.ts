export type BackgroundTaskName =
  | 'sync.flush'
  | 'downloads.resume'
  | 'playback.progress.flush';

export type BackgroundScheduleOptions = {
  earliestStartAt?: string;
  requiresNetwork?: boolean;
};

export type ScheduledBackgroundTask = {
  name: BackgroundTaskName;
  options: BackgroundScheduleOptions;
};

export type BackgroundTaskHandler = () => Promise<void>;
