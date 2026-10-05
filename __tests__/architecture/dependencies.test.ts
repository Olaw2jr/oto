/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const app = path.join(root, 'app');

const read = (relative: string) =>
  fs.readFileSync(path.join(root, relative), 'utf8');

const sourceFiles = (dir: string): string[] =>
  fs
    .readdirSync(dir, {withFileTypes: true})
    .flatMap(entry => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory()
        ? sourceFiles(full)
        : /\.(ts|tsx)$/.test(entry.name)
        ? [full]
        : [];
    });

describe('application dependency direction', () => {
  it('keeps domain contracts framework and infrastructure independent', () => {
    const domain = path.join(app, 'domain');
    expect(fs.existsSync(domain)).toBe(true);

    const forbidden = [
      'react',
      'react-native',
      '/services/',
      '/repositories/',
      '/storage/',
      '/api/',
      '/audio/',
      '/sync/',
      '/background/',
      '/features/',
      '/state/',
      '/ui/',
    ];

    for (const file of sourceFiles(domain)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const dependency of forbidden) {
        expect(source).not.toContain(dependency);
      }
    }
  });

  it('keeps application services independent from React and presentation state', () => {
    const services = path.join(app, 'services');
    expect(fs.existsSync(services)).toBe(true);

    const forbidden = [
      "from 'react'",
      'from "react"',
      "from 'react-native'",
      'from "react-native"',
      '/features/',
      '/state/',
      '/ui/',
    ];

    for (const file of sourceFiles(services)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const dependency of forbidden) {
        expect(source).not.toContain(dependency);
      }
    }
  });

  it('keeps the audio contract independent from React, storage and concrete players', () => {
    const audio = path.join(app, 'audio');
    expect(fs.existsSync(audio)).toBe(true);

    const forbidden = [
      "from 'react'",
      'from "react"',
      "from 'react-native'",
      'from "react-native"',
      '/state/',
      '/features/',
      '/ui/',
      '@rntp/',
      'react-native-track-player',
    ];

    for (const file of sourceFiles(audio)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const dependency of forbidden) {
        expect(source).not.toContain(dependency);
      }
    }
  });

  it('keeps sync contracts independent from React and concrete persistence', () => {
    const sync = path.join(app, 'sync');
    expect(fs.existsSync(sync)).toBe(true);

    const forbidden = [
      "from 'react'",
      'from "react"',
      "from 'react-native'",
      'from "react-native"',
      '/features/',
      '/state/',
      '/ui/',
      '@react-native-async-storage',
      'sqlite',
    ];

    for (const file of sourceFiles(sync)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const dependency of forbidden) {
        expect(source).not.toContain(dependency);
      }
    }
  });

  it('keeps background scheduling independent from platform schedulers', () => {
    const background = path.join(app, 'background');
    expect(fs.existsSync(background)).toBe(true);

    const forbidden = [
      "from 'react'",
      'from "react"',
      "from 'react-native'",
      'from "react-native"',
      'WorkManager',
      'BGTaskScheduler',
      'HeadlessJsTask',
      '/features/',
      '/state/',
      '/ui/',
    ];

    for (const file of sourceFiles(background)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const dependency of forbidden) {
        expect(source).not.toContain(dependency);
      }
    }
  });

  it('defines library identity and state in the domain layer', () => {
    const source = read('app/domain/library.ts');
    expect(source).toContain('export type BookId');
    expect(source).toContain('export type LibraryStatus');
    expect(source).toContain('export type LibraryEntry');
    expect(source).toContain('export type ListeningProgress');
  });

  it('keeps the existing mock-data Status API as a domain alias', () => {
    const social = read('app/data/social.ts');
    expect(social).toContain("from '../domain/library'");
    expect(social).toContain('export type Status = LibraryStatus');
  });
});
