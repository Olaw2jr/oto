/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('iOS native CI', () => {
  it('builds oto on the Xcode 27 GitHub runner without signing', () => {
    const workflow = read('.github/workflows/ios-ci.yml');
    expect(workflow).toContain('runs-on: xcode-27');
    expect(workflow).toContain('ruby/setup-ruby@v1');
    expect(workflow).toContain("ruby-version: '3.4'");
    expect(workflow).toContain('bundle exec pod install --project-directory=ios');
    expect(workflow).toContain('-workspace ios/Eyy.xcworkspace');
    expect(workflow).toContain('-scheme Eyy');
    expect(workflow).toContain('CODE_SIGNING_ALLOWED=NO');
  });

  it('runs only when iOS or shared runtime inputs can affect the build', () => {
    const workflow = read('.github/workflows/ios-ci.yml');
    expect(workflow).toContain('ios/**');
    expect(workflow).toContain('Gemfile');
    expect(workflow).toContain('package.json');
    expect(workflow).toContain('package-lock.json');
    expect(workflow).toContain('app.json');
  });
});
