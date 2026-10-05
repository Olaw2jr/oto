import type {BackgroundScheduler} from '../BackgroundScheduler';
import type {
  BackgroundScheduleOptions,
  BackgroundTaskHandler,
  BackgroundTaskName,
  ScheduledBackgroundTask,
} from '../types';

export class FakeBackgroundScheduler implements BackgroundScheduler {
  private readonly handlers = new Map<BackgroundTaskName, BackgroundTaskHandler>();
  private tasks: ScheduledBackgroundTask[] = [];

  register(
    name: BackgroundTaskName,
    handler: BackgroundTaskHandler,
  ): () => void {
    this.handlers.set(name, handler);
    return () => {
      if (this.handlers.get(name) === handler) {
        this.handlers.delete(name);
      }
    };
  }

  async schedule(
    name: BackgroundTaskName,
    options: BackgroundScheduleOptions = {},
  ): Promise<void> {
    this.tasks = [
      ...this.tasks.filter(task => task.name !== name),
      {name, options: {...options}},
    ];
  }

  async cancel(name: BackgroundTaskName): Promise<void> {
    this.tasks = this.tasks.filter(task => task.name !== name);
  }

  scheduled(): ScheduledBackgroundTask[] {
    return this.tasks.map(task => ({
      name: task.name,
      options: {...task.options},
    }));
  }

  async run(name: BackgroundTaskName): Promise<void> {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No background handler registered for ${name}`);
    }
    await handler();
  }
}
