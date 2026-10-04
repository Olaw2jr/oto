/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('app name', () => {
  it('shows "oto" to people on both platforms', () => {
    expect(JSON.parse(read('app.json')).displayName).toBe('oto');
    expect(read('android/app/src/main/res/values/strings.xml')).toContain(
      '<string name="app_name">oto</string>',
    );
    expect(read('ios/Eyy/Info.plist')).toMatch(
      /<key>CFBundleDisplayName<\/key>\s*<string>oto<\/string>/,
    );
  });

  it('keeps the registered module name the native projects expect', () => {
    const moduleName = JSON.parse(read('app.json')).name;
    expect(moduleName).toBe('Eyy');
    expect(
      read('android/app/src/main/java/com/eyy/MainActivity.java'),
    ).toContain(`return "${moduleName}";`);
    expect(read('ios/Eyy/AppDelegate.mm')).toContain(
      `RCTAppSetupDefaultRootView(bridge, @"${moduleName}"`,
    );
  });
});
