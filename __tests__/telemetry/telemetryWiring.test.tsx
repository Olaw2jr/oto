import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react-native';

import {PlaybackUnavailableError} from '../../app/player';
import {LibraryProvider} from '../../app/state/library';
import {PlayerProvider, usePlayer} from '../../app/state/player';
import {SettingsProvider} from '../../app/state/settings';
import {
  installGlobalErrorReporting,
  TelemetryProvider,
} from '../../app/state/telemetry';
import type {Telemetry} from '../../app/telemetry';

const fakeTelemetry = () => {
  const calls: Array<[string, ...unknown[]]> = [];
  const telemetry: Telemetry = {
    error: (...args) => calls.push(['error', ...args]),
    event: (...args) => calls.push(['event', ...args]),
    metric: (...args) => calls.push(['metric', ...args]),
  };
  return {telemetry, calls};
};

describe('telemetry wiring', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('reports playback failures without personal details', async () => {
    const {telemetry, calls} = fakeTelemetry();
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <TelemetryProvider telemetry={telemetry}>
        <SettingsProvider>
          <LibraryProvider>
            <PlayerProvider
              createController={() =>
                Promise.reject(new PlaybackUnavailableError('no rendition'))
              }>
              {children}
            </PlayerProvider>
          </LibraryProvider>
        </SettingsProvider>
      </TelemetryProvider>
    );
    const {result} = renderHook(() => usePlayer(), {wrapper});
    act(() => result.current.play('project-hail-mary'));

    await waitFor(() =>
      expect(calls).toContainEqual([
        'event',
        'playback.failed',
        {reason: 'unavailable', bookId: 'project-hail-mary'},
      ]),
    );
  });

  it('reports uncaught errors and still hands them to the previous handler', () => {
    const {telemetry, calls} = fakeTelemetry();
    const previous = jest.fn();
    let handler: (error: unknown, isFatal?: boolean) => void = () => {};
    const errorUtils = {
      getGlobalHandler: () => previous,
      setGlobalHandler: (next: typeof handler) => {
        handler = next;
      },
    };

    installGlobalErrorReporting(telemetry, errorUtils);
    const error = new Error('render failed');
    handler(error, true);

    expect(calls).toContainEqual(['error', error, {fatal: true, source: 'global'}]);
    expect(previous).toHaveBeenCalledWith(error, true);
  });
});
