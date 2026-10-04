/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const iosIcons = path.join(root, 'ios/Eyy/Images.xcassets/AppIcon.appiconset');
const res = path.join(root, 'android/app/src/main/res');

// Width and height from a PNG's IHDR chunk, plus whether it has alpha.
const png = (file: string) => {
  const buf = fs.readFileSync(file);
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    hasAlpha: [4, 6].includes(buf[25]),
  };
};

describe('iOS app icon', () => {
  const {images} = JSON.parse(
    fs.readFileSync(path.join(iosIcons, 'Contents.json'), 'utf8'),
  ) as {images: {size: string; scale: string; filename?: string}[]};

  it.each(images.map(i => [`${i.size}@${i.scale}`, i]))(
    '%s points at an opaque PNG of the right size',
    (_, image) => {
      expect(image.filename).toBeDefined();
      const px = parseFloat(image.size) * parseFloat(image.scale);
      const icon = png(path.join(iosIcons, image.filename!));
      expect(icon).toEqual({width: px, height: px, hasAlpha: false});
    },
  );

  it('includes the 1024 px App Store icon', () => {
    expect(images.some(i => i.size === '1024x1024')).toBe(true);
  });
});

describe('Android launcher icon', () => {
  it.each([
    ['mdpi', 48],
    ['hdpi', 72],
    ['xhdpi', 96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192],
  ])('has %s legacy icons at %ipx', (density, px) => {
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
      const icon = png(path.join(res, `mipmap-${density}`, name));
      expect([icon.width, icon.height]).toEqual([px, px]);
    }
  });

  it('defines an adaptive icon with a monochrome layer', () => {
    for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
      const xml = fs.readFileSync(
        path.join(res, 'mipmap-anydpi-v26', name),
        'utf8',
      );
      expect(xml).toContain('@color/ic_launcher_background');
      expect(xml).toContain('@drawable/ic_launcher_foreground');
      expect(xml).toContain('<monochrome');
    }
    expect(
      fs.existsSync(path.join(res, 'drawable/ic_launcher_foreground.xml')),
    ).toBe(true);
    expect(
      fs.readFileSync(
        path.join(res, 'values/ic_launcher_background.xml'),
        'utf8',
      ),
    ).toContain('#E6E3DA');
  });
});
