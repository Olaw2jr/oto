/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file: string) => fs.existsSync(path.join(root, file));

describe('React Native 0.87 iOS baseline', () => {
  it('uses the current CocoaPods/Xcode project tooling baseline', () => {
    const gemfile = read('Gemfile');
    expect(gemfile).toContain("gem 'cocoapods', '1.16.2'");
    expect(gemfile).toContain("gem 'xcodeproj', '1.28.1'");
  });

  it('uses the RN 0.87 Podfile integration', () => {
    const podfile = read('ios/Podfile');
    expect(podfile).toContain('platform :ios, min_ios_version_supported');
    expect(podfile).toContain('prepare_react_native_project!');
    expect(podfile).toContain('use_react_native!');
    expect(podfile).not.toContain('FlipperConfiguration');
    expect(podfile).toContain("build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'");
  });

  it('uses the Swift React Native app delegate and oto module name', () => {
    const delegate = read('ios/Eyy/AppDelegate.swift');
    expect(delegate).toContain('RCTReactNativeFactory');
    expect(delegate).toContain('RCTAppDependencyProvider');
    expect(delegate).toContain('withModuleName: "oto"');
    expect(exists('ios/Eyy/AppDelegate.mm')).toBe(false);
    expect(exists('ios/Eyy/AppDelegate.h')).toBe(false);
    expect(exists('ios/Eyy/main.m')).toBe(false);
  });

  it('targets iOS 15.1 with the production bundle identifier', () => {
    const project = read('ios/Eyy.xcodeproj/project.pbxproj');
    expect(project).toContain('IPHONEOS_DEPLOYMENT_TARGET = 15.1;');
    expect(project).toMatch(/PRODUCT_BUNDLE_IDENTIFIER = "?tz\.co\.oto"?;/);
    expect(project).toContain('AppDelegate.swift in Sources');
  });

  it('ships a privacy manifest and modern app transport baseline', () => {
    expect(exists('ios/Eyy/PrivacyInfo.xcprivacy')).toBe(true);
    const privacy = read('ios/Eyy/PrivacyInfo.xcprivacy');
    expect(privacy).toContain('NSPrivacyAccessedAPITypes');
    const project = read('ios/Eyy.xcodeproj/project.pbxproj');
    expect(project).not.toContain('\\n\\t\\tA100');
    const plist = read('ios/Eyy/Info.plist');
    expect(plist).toContain('<key>NSAllowsLocalNetworking</key>');
    expect(plist).toMatch(/<key>UIRequiredDeviceCapabilities<\/key>[\s\S]*<string>arm64<\/string>/);
  });
});
