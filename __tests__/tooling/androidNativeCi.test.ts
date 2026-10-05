/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Android native CI', () => {
  it('builds the RN 0.87 Android app with JDK 17', () => {
    const workflow = read('.github/workflows/android-ci.yml');
    expect(workflow).toContain('actions/setup-java@v6');
    expect(workflow).toContain("java-version: '17'");
    expect(workflow).toContain('distribution: temurin');
    expect(workflow).toContain('cache: gradle');
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('./gradlew :app:assembleDebug --no-daemon');
  });

  it('runs only when Android or shared runtime inputs can affect the build', () => {
    const workflow = read('.github/workflows/android-ci.yml');
    expect(workflow).toContain('android/**');
    expect(workflow).toContain('package.json');
    expect(workflow).toContain('package-lock.json');
    expect(workflow).toContain('app.json');
  });
});
