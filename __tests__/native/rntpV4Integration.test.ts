/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('RN Track Player v4 integration', () => {
  it('pins the Apache-2.0 v4 release selected for oto', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.dependencies['react-native-track-player']).toBe('4.1.2');
  });

  it('isolates the native package behind a lazy factory and driver', () => {
    const driver = read('app/audio/rntp/NativeRntpDriver.ts');
    const factory = read('app/audio/rntp/createNativeRntpAudioEngine.ts');

    expect(driver).toContain("from 'react-native-track-player'");
    expect(factory).toContain("import('./NativeRntpDriver')");
    expect(factory).not.toContain(
      "import TrackPlayer from 'react-native-track-player'",
    );
  });
});
