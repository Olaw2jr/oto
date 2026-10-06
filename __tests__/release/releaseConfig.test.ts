/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('release configuration baseline', () => {
  it('derives Android versioning and environment from external release inputs', () => {
    const gradle = read('android/app/build.gradle');
    expect(gradle).toContain('packageVersion');
    expect(gradle).toContain('OTO_BUILD_NUMBER');
    expect(gradle).toContain('OTO_ENVIRONMENT');
    expect(gradle).toContain('System.getenv');
  });

  it('keeps Android release signing secrets outside source control', () => {
    const gradle = read('android/app/build.gradle');
    expect(gradle).toContain('OTO_UPLOAD_STORE_FILE');
    expect(gradle).toContain('OTO_UPLOAD_STORE_PASSWORD');
    expect(gradle).toContain('OTO_UPLOAD_KEY_ALIAS');
    expect(gradle).toContain('OTO_UPLOAD_KEY_PASSWORD');
    expect(gradle).not.toContain('storePassword "');
    expect(gradle).not.toContain('keyPassword "');
  });

  it('uses Xcode build settings for iOS version and environment', () => {
    const plist = read('ios/Eyy/Info.plist');
    const project = read('ios/Eyy.xcodeproj/project.pbxproj');

    expect(plist).toContain('$(MARKETING_VERSION)');
    expect(plist).toContain('$(CURRENT_PROJECT_VERSION)');
    expect(plist).toContain('$(OTO_ENVIRONMENT)');
    expect(project).toContain('MARKETING_VERSION = 0.0.1;');
    expect(project).toContain('OTO_ENVIRONMENT = development;');
    expect(project).toContain('OTO_ENVIRONMENT = production;');
  });

  it('validates only supported release environments', () => {
    const config = require('../../scripts/release/config');
    expect(config.resolveEnvironment('development')).toBe('development');
    expect(config.resolveEnvironment('staging')).toBe('staging');
    expect(config.resolveEnvironment('production')).toBe('production');
    expect(() => config.resolveEnvironment('preview')).toThrow(
      'Unsupported OTO_ENVIRONMENT',
    );
  });

  it('documents secret-safe release inputs', () => {
    const docs = read('docs/release/configuration.md');
    expect(docs).toContain('OTO_BUILD_NUMBER');
    expect(docs).toContain('OTO_UPLOAD_STORE_PASSWORD');
    expect(docs).toContain('Do not commit');
  });
});
