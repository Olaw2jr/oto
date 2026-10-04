/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('oto native identity', () => {
  it('shows "oto" to people on both platforms', () => {
    expect(JSON.parse(read('app.json')).displayName).toBe('oto');
    expect(read('android/app/src/main/res/values/strings.xml')).toContain(
      '<string name="app_name">oto</string>',
    );
    expect(read('ios/Eyy/Info.plist')).toMatch(
      /<key>CFBundleDisplayName<\/key>\s*<string>oto<\/string>/,
    );
  });

  it('registers the React Native module as oto', () => {
    const moduleName = JSON.parse(read('app.json')).name;
    expect(moduleName).toBe('oto');
    expect(
      read('android/app/src/main/java/tz/co/oto/MainActivity.java'),
    ).toContain(`return "${moduleName}";`);
    // React Native 0.71's RCTAppDelegate takes the module name as a property.
    expect(read('ios/Eyy/AppDelegate.mm')).toContain(
      `self.moduleName = @"${moduleName}";`,
    );
  });

  it('uses tz.co.oto as the production identifier on Android and iOS', () => {
    expect(read('android/app/build.gradle')).toContain(
      'applicationId "tz.co.oto"',
    );
    // Since React Native 0.71 the package lives in build.gradle as namespace.
    expect(read('android/app/build.gradle')).toContain('namespace "tz.co.oto"');
    expect(read('ios/Eyy.xcodeproj/project.pbxproj')).toMatch(
      /PRODUCT_BUNDLE_IDENTIFIER = "?tz\.co\.oto"?;/,
    );
  });

  it('uses oto as the npm package identity', () => {
    expect(JSON.parse(read('package.json')).name).toBe('oto');
  });
});
