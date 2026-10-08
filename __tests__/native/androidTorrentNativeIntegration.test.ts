/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) =>
  fs.readFileSync(path.join(root, file), 'utf8');

describe('Android native torrent runtime', () => {
  it('pins the Android 24-compatible MIT jlibtorrent release for every app ABI', () => {
    const rootGradle = read('android/build.gradle');
    const appGradle = read('android/app/build.gradle');

    expect(rootGradle).toContain('https://dl.frostwire.com/maven');
    expect(appGradle).toContain('jlibtorrentVersion = "2.0.12.9"');
    expect(appGradle).toContain('jlibtorrent-android-arm');
    expect(appGradle).toContain('jlibtorrent-android-arm64');
    expect(appGradle).toContain('jlibtorrent-android-x86');
    expect(appGradle).toContain('jlibtorrent-android-x86_64');
  });

  it('registers one native module for torrent sessions and range streaming', () => {
    const app = read(
      'android/app/src/main/java/tz/co/oto/MainApplication.kt',
    );
    const module = read(
      'android/app/src/main/java/tz/co/oto/torrent/OtoTorrentModule.kt',
    );

    expect(app).toContain('OtoTorrentPackage');
    expect(module).toContain('fun open(');
    expect(module).toContain('fun prioritizeRange(');
    expect(module).toContain('fun exportResumeData(');
    expect(module).toContain('fun startRangeServer(');
    expect(module).toContain('fun stopRangeServer(');
  });

  it('binds the media range server to loopback with unguessable route tokens', () => {
    const server = read(
      'android/app/src/main/java/tz/co/oto/torrent/LoopbackRangeServer.kt',
    );

    expect(server).toContain('InetAddress.getByName("127.0.0.1")');
    expect(server).toContain('SecureRandom');
    expect(server).toContain('Range');
    expect(server).toContain('206 Partial Content');
    expect(server).not.toContain('0.0.0.0');
  });

  it('keeps exact-file selection and piece prioritization in the libtorrent adapter', () => {
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );

    expect(engine).toContain('selectFile');
    expect(engine).toContain('filePath');
    expect(engine).toContain('mapFile');
    expect(engine).toContain('setPieceDeadline');
    expect(engine).toContain('Priority.SEVEN');
  });

  it('treats range-worker interruption during route cleanup as cancellation', () => {
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );
    const server = read(
      'android/app/src/main/java/tz/co/oto/torrent/LoopbackRangeServer.kt',
    );

    expect(engine).toContain('catch (interrupted: InterruptedException)');
    expect(engine).toContain('Thread.currentThread().interrupt()');
    expect(server).toContain('if (!rangeReady) return');
  });
});
