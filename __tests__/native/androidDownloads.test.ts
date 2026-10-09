/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const media = 'android/app/src/main/java/tz/co/oto/media';

// D2: Android downloads use Media3's DownloadManager/DownloadService and play
// from the download cache through the normal HTTPS URL and cache key.
describe('Android downloads', () => {
  it('keeps downloads in a separate, never-evicted cache outside backups', () => {
    const downloads = read(`${media}/OtoDownloads.kt`);
    expect(downloads).toContain('NoOpCacheEvictor()');
    expect(downloads).toContain('noBackupFilesDir');
    expect(downloads).toContain('DownloadManager(');
    expect(downloads).toContain('Requirements.NETWORK_UNMETERED');
  });

  it('plays downloads first, then the streaming cache, then the network', () => {
    const cache = read(`${media}/OtoMedia3Cache.kt`);
    expect(cache).toContain('setCache(OtoDownloads.cache(context))');
    expect(cache).toContain('setCacheWriteDataSinkFactory(null)');
    expect(cache).toContain('setUpstreamDataSourceFactory(streamingDataSourceFactory(context))');
  });

  it('runs downloads in a foreground data-sync service with a progress notification', () => {
    const service = read(`${media}/OtoMedia3DownloadService.kt`);
    expect(service).toMatch(/:\s*DownloadService\(/);
    expect(service).toContain('DownloadNotificationHelper');
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    expect(manifest).toContain('android:name=".media.OtoMedia3DownloadService"');
    expect(manifest).toMatch(/OtoMedia3DownloadService"[\s\S]*?android:exported="false"[\s\S]*?android:foregroundServiceType="dataSync"/);
    expect(manifest).toContain('android.permission.FOREGROUND_SERVICE_DATA_SYNC');
    expect(manifest).toContain('android.permission.POST_NOTIFICATIONS');
  });

  it('exposes start, remove, Wi-Fi only, list, playback source and progress events to JS', () => {
    const module = read(`${media}/OtoDownloadsModule.kt`);
    for (const method of ['fun start(', 'fun remove(', 'fun setWifiOnly(', 'fun list(', 'fun playbackSource(']) {
      expect(module).toContain(method);
    }
    expect(module).toContain('setCustomCacheKey(');
    expect(module).toContain('"oto-downloads"');
    expect(read('android/app/src/main/java/tz/co/oto/media/OtoMedia3Package.kt')).toContain('OtoDownloadsModule(');
  });
});
