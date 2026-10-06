/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../app/state/library.tsx'),
  'utf8',
);

describe('LibraryProvider service adapter boundary', () => {
  it('keeps library use-case rules out of the React provider', () => {
    expect(source).toContain('LibraryProviderAdapter');
    expect(source).not.toContain("from '../data/catalogue'");
    expect(source).not.toContain('getBook(');
  });
});
