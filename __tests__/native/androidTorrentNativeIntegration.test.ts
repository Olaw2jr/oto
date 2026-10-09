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

  // Found on a Galaxy S22 Ultra: a timeout on the range thread killed the app.
  it('fails one range request without crashing the app', () => {
    const server = read(
      'android/app/src/main/java/tz/co/oto/torrent/LoopbackRangeServer.kt',
    );
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );

    expect(server).toMatch(/clients\.execute \{\s*try \{\s*socket\.use\(::serve\)/);
    expect(server).toContain('catch (error: Throwable)');
    expect(engine).not.toContain('"Timed out waiting for torrent byte range"');
    expect(engine).toContain('logStalledRange');
  });

  // Recent Android hides the routing table, so libtorrent's default 0.0.0.0
  // listen fails and no outgoing peer or web seed connection can open.
  it('listens on the active network addresses', () => {
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );

    expect(engine).toContain('activeListenInterfaces()');
    expect(engine).toContain('connectivity.getLinkProperties');
    expect(engine).toContain('manager.start(SessionParams(settings))');
  });

  // #135: libtorrent's bundled OpenSSL fails HTTPS web seeds on Android
  // ("init fail (BIO routines)"), so HTTPS seeds go through a loopback proxy
  // that uses Android's own TLS.
  it('routes HTTPS web seeds through a loopback proxy', () => {
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );
    const proxy = read(
      'android/app/src/main/java/tz/co/oto/torrent/WebSeedProxy.kt',
    );

    // Swapped before the paused torrent resumes, so libtorrent never tries TLS.
    const swap = engine.indexOf('proxyHttpsWebSeeds(handle)');
    expect(swap).toBeGreaterThan(-1);
    expect(swap).toBeLessThan(engine.indexOf('handle.resume()'));
    expect(engine).toContain('127.0.0.1:0');

    expect(proxy).toContain('InetAddress.getByName("127.0.0.1")');
    expect(proxy).toContain('SecureRandom');
    expect(proxy).toContain('HttpsURLConnection');
    // Forwards only to the HTTPS seed it was registered for.
    expect(proxy).toContain('require(seed.startsWith("https://"))');
    expect(proxy).toMatch(/method != "GET" && method != "HEAD"/);
    expect(proxy).toContain('setRequestProperty("Range"');
  });

  // #135: with the file and the wanted range both at SEVEN, and 16 MiB web
  // seed requests, the piece playback waited for arrived last.
  it('fetches the wanted range before the rest of the streamed file', () => {
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );

    expect(engine).toContain('"high" -> Priority.FIVE');
    expect(engine).toContain('piecePriority(piece, Priority.SEVEN)');
    expect(engine).toMatch(/urlseed_max_request_bytes[\s\S]*1 shl 20/);
  });

  // Changing any file's priority resets libtorrent's piece priorities, so
  // the range playback waits for is re-applied while waiting.
  it('keeps re-applying the awaited range priority', () => {
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );
    expect(engine).toContain('REPRIORITIZE_EVERY_NANOS');
  });

  // Pieces of a priority-0 file go to libtorrent's hidden .parts file, which
  // the range server can't read, so the file being played must be wanted.
  it('keeps the file being played on disk', () => {
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );
    const range = engine.slice(engine.indexOf('fun prioritizeRange('));
    expect(range.indexOf('ensureFileWanted(active, fileIndex)')).toBeGreaterThan(-1);
    expect(range.indexOf('ensureFileWanted(active, fileIndex)')).toBeLessThan(
      range.indexOf('piecePriority(piece, Priority.SEVEN)'),
    );
    expect(engine).toContain('Priority.NORMAL');
  });

  // #138: a non-zero file priority wants the whole file, so every played
  // chapter kept downloading in full after playback ended.
  it('downloads only the requested ranges of a streamed file', () => {
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );
    expect(engine).toContain('fun applyStreamingPieces(');
    expect(engine).toContain('active.handle.prioritizePieces(');
    // Re-applied after every file-priority change, which resets pieces.
    const setFile = engine.slice(engine.indexOf('fun setFilePriority('));
    expect(setFile.indexOf('applyStreamingPieces(active)')).toBeGreaterThan(-1);
    expect(setFile.indexOf('applyStreamingPieces(active)')).toBeLessThan(
      setFile.indexOf('fun prioritizeRange('),
    );
  });

  // #138: closing the last torrent left the web seed proxy registrations and
  // libtorrent's session (listen sockets, DHT) running.
  it('releases everything when the last torrent closes', () => {
    const engine = read(
      'android/app/src/main/java/tz/co/oto/torrent/JlibtorrentEngine.kt',
    );
    const proxy = read(
      'android/app/src/main/java/tz/co/oto/torrent/WebSeedProxy.kt',
    );
    const close = engine.slice(engine.indexOf('  fun close(sessionId: String)'));
    expect(close).toContain('webSeedProxy.unregister(');
    expect(close).toContain('manager.stop()');
    expect(close).toContain('proxy?.close()');
    expect(proxy).toContain('fun unregister(');
  });
});
