/// <reference types="node" />
import fs from 'fs';
import path from 'path';

// HA-07: how long the app takes from JS start until it's ready to use.
describe('startup metric', () => {
  afterEach(() => jest.resetModules());

  it('reports the time from JS start to ready, once per launch', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const {reportStartup} = require('../../app/telemetry/startup');
    now.mockReturnValue(1_850);
    const metric = jest.fn();
    const telemetry = {metric, error: jest.fn(), event: jest.fn()};

    reportStartup(telemetry);
    reportStartup(telemetry);

    expect(metric).toHaveBeenCalledTimes(1);
    expect(metric).toHaveBeenCalledWith('startup.ready_ms', 850);
    now.mockRestore();
  });

  it('marks JS start before anything else loads', () => {
    const index = fs.readFileSync(path.join(__dirname, '../../index.js'), 'utf8');
    const firstImport = index.split('\n').find(line => line.startsWith('import'));
    expect(firstImport).toBe("import './app/telemetry/startup';");
    expect(
      fs.readFileSync(path.join(__dirname, '../../app/state/AppProviders.tsx'), 'utf8'),
    ).toContain('reportStartup(container.telemetry.telemetry)');
  });
});
