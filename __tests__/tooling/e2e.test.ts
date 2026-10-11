/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

// HA-03: critical flows run end to end on a real Android emulator.
describe('end-to-end smoke flows', () => {
  it('covers sign-in, playback and shelves', () => {
    const flows = fs.readdirSync(path.join(root, '.maestro')).sort();
    expect(flows).toEqual(['01-sign-in.yaml', '02-play-sample.yaml', '03-shelves.yaml']);
    for (const flow of flows) {
      const text = read(`.maestro/${flow}`);
      expect(text).toContain('appId: tz.co.oto');
      expect(text).toContain('smoke');
    }
  });

  it('runs them on an emulator against a release build', () => {
    const workflow = read('.github/workflows/e2e-android.yml');
    expect(workflow).toContain('reactivecircus/android-emulator-runner@v2');
    expect(workflow).toContain(':app:assembleRelease');
    expect(workflow).toContain('maestro test .maestro --include-tags smoke');
    expect(workflow).toContain('workflow_dispatch');
  });
});
