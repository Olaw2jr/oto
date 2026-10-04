/// <reference types="node" />
import fs from 'fs';
import path from 'path';

import {fonts} from '../../app/theme/typography';

const root = path.resolve(__dirname, '../..');
const families = [...Object.values(fonts.sans), ...Object.values(fonts.serif)];

describe('bundled fonts', () => {
  it('declares the fonts directory as a React Native asset', () => {
    const config = require(path.join(root, 'react-native.config.js'));
    expect(config.assets).toContain('./app/assets/fonts');
  });

  it.each(families)('ships %s.ttf with its licence', family => {
    expect(
      fs.existsSync(path.join(root, 'app/assets/fonts', `${family}.ttf`)),
    ).toBe(true);
  });

  it.each(families)('links %s for Android', family => {
    expect(
      fs.existsSync(
        path.join(root, 'android/app/src/main/assets/fonts', `${family}.ttf`),
      ),
    ).toBe(true);
  });

  it.each(families)('registers %s in the iOS Info.plist', family => {
    const plist = fs.readFileSync(
      path.join(root, 'ios/Eyy/Info.plist'),
      'utf8',
    );
    expect(plist).toContain(`<string>${family}.ttf</string>`);
  });

  it('includes the SIL Open Font License for each family', () => {
    const dir = path.join(root, 'app/assets/fonts');
    expect(fs.existsSync(path.join(dir, 'Figtree-OFL.txt'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'ShipporiMincho-OFL.txt'))).toBe(true);
  });
});
