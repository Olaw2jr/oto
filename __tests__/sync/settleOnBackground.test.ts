import {settleOnBackground} from '../../app/sync/settleOnBackground';
import type {SyncRecorder} from '../../app/sync/SyncRecorder';

describe('settleOnBackground', () => {
  it('records held-back positions when the app leaves the foreground', () => {
    let listener: (state: string) => void = () => {};
    let removed = false;
    const appState = {
      addEventListener: (_: 'change', fn: (state: string) => void) => {
        listener = fn;
        return {remove: () => void (removed = true)};
      },
    };
    let settled = 0;
    const recorder = {settle: async () => void (settled += 1)} as unknown as SyncRecorder;

    const stop = settleOnBackground(recorder, appState);
    listener('active');
    listener('inactive');
    listener('background');
    stop();

    expect(settled).toBe(2);
    expect(removed).toBe(true);
  });
});
