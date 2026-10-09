/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import React from 'react';
import {AccessibilityInfo, Animated} from 'react-native';
import {screen} from '@testing-library/react-native';

import {LoadingState} from '../../app/components/LoadingState';
import {Txt} from '../../app/ui';
import {renderWithTheme} from '../test-utils';

const sources = (dir: string): string[] =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? sources(full)
      : /\.tsx?$/.test(entry.name)
      ? [full]
      : [];
  });

// HA-02: text follows the system font size, within limits that keep layouts
// usable.
describe('text scaling', () => {
  it('lets body text grow up to 2x and headings up to 1.5x', async () => {
    await renderWithTheme(
      <>
        <Txt>Body</Txt>
        <Txt variant="display">Heading</Txt>
      </>,
    );
    expect(screen.getByText('Body').props.maxFontSizeMultiplier).toBe(2);
    expect(screen.getByText('Heading').props.maxFontSizeMultiplier).toBe(1.5);
    expect(screen.getByText('Body').props.allowFontScaling).not.toBe(false);
  });

  it('never turns font scaling off', () => {
    const offenders = sources(path.join(__dirname, '../../app')).filter(file =>
      /allowFontScaling=\{false\}|allowFontScaling:\s*false/.test(
        fs.readFileSync(file, 'utf8'),
      ),
    );
    expect(offenders).toEqual([]);
  });
});

describe('reduced motion', () => {
  afterEach(() => jest.restoreAllMocks());

  it('holds the loading animation still when the system asks for less motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const loop = jest.spyOn(Animated, 'loop');
    await renderWithTheme(<LoadingState message="Loading" />);
    expect(loop).not.toHaveBeenCalled();
    expect(screen.getByText('Loading')).toBeOnTheScreen();
  });

  it('animates otherwise', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const loop = jest.spyOn(Animated, 'loop');
    await renderWithTheme(<LoadingState message="Loading" />);
    expect(loop).toHaveBeenCalled();
  });
});
